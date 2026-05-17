import { watch } from "node:fs"
import { opendir } from "node:fs/promises"
import path from "node:path"
import { reindexFiles } from "./indexer.js"
import { safeRepoRoot, shouldReadFile, shouldSkipDirectory } from "./security.js"

const DEBOUNCE_MS = 600

export async function startWatcher(repoPath, options = {}) {
  const root = safeRepoRoot(repoPath)
  const pending = new Set()
  const timer = { ref: null }
  const watchers = []

  const schedule = (fullPath) => {
    pending.add(fullPath)
    clearTimeout(timer.ref)
    timer.ref = setTimeout(() => flush(root, pending, options), DEBOUNCE_MS)
  }

  const handler = (dir) => (_, filename) => {
    if (!filename) return
    const fullPath = path.join(dir, filename)
    if (!shouldReadFile(fullPath)) return
    const rel = path.relative(root, fullPath)
    if (rel.split(path.sep).some((p) => shouldSkipDirectory(p))) return
    schedule(fullPath)
  }

  try {
    watchers.push(watch(root, { recursive: true }, handler(root)))
  } catch {
    await watchDirsManually(root, root, handler, watchers)
  }

  return {
    stop() {
      clearTimeout(timer.ref)
      for (const w of watchers) w.close()
    },
  }
}

async function watchDirsManually(root, dir, handler, watchers) {
  watchers.push(watch(dir, handler(dir)))
  const handle = await opendir(dir)
  for await (const entry of handle) {
    if (entry.isDirectory() && !shouldSkipDirectory(entry.name)) {
      await watchDirsManually(root, path.join(dir, entry.name), handler, watchers)
    }
  }
}

function flush(root, pending, options) {
  const changed = [...pending]
  pending.clear()
  reindexFiles(root, changed, options).catch((err) => {
    process.stderr.write(`[open-context-map] reindex error: ${err.message}\n`)
  })
}
