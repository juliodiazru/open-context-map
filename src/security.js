import { createHash } from "node:crypto"
import { opendir, readFile, stat } from "node:fs/promises"
import path from "node:path"

export const INDEX_DIR = ".open-context-map"
export const INDEX_FILE = "index.json"

export const DEFAULT_EXCLUDED_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  ".open-context-map",
  ".repo-graph",
  "node_modules",
  "vendor",
  "dist",
  "build",
  ".gradle",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  "target",
  "__pycache__",
])

export const DEFAULT_INCLUDED_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".go",
  ".java",
  ".cs",
  ".php",
  ".rb",
  ".rs",
  ".kt",
  ".swift",
])

export const DEFAULT_MAX_FILE_BYTES = 350_000
export const DEFAULT_MAX_FILES = 5_000

export function normalizePath(value) {
  return value.split(path.sep).join("/")
}

export function safeRepoRoot(repoPath = process.cwd()) {
  return path.resolve(repoPath)
}

export function resolveInside(root, unsafePath = ".") {
  const resolved = path.resolve(root, unsafePath)
  const relative = path.relative(root, resolved)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Ruta fuera del repositorio bloqueada: ${unsafePath}`)
  }
  return resolved
}

export function indexPathFor(root) {
  return path.join(root, INDEX_DIR, INDEX_FILE)
}

export function shouldSkipDirectory(name) {
  return DEFAULT_EXCLUDED_DIRS.has(name)
}

export function shouldReadFile(filePath) {
  return DEFAULT_INCLUDED_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

export async function readTextFileSafely(filePath, maxBytes = DEFAULT_MAX_FILE_BYTES) {
  const fileStat = await stat(filePath)
  if (!fileStat.isFile()) return null
  if (fileStat.size > maxBytes) return null
  const text = await readFile(filePath, "utf8")
  if (text.includes("\u0000")) return null
  return text
}

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex")
}

export async function walkSourceFiles(root, options = {}) {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES
  const files = []

  async function visit(currentDir) {
    if (files.length >= maxFiles) return
    const dir = await opendir(currentDir)
    for await (const entry of dir) {
      if (files.length >= maxFiles) break
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name)) await visit(fullPath)
        continue
      }
      if (entry.isFile() && shouldReadFile(fullPath)) files.push(fullPath)
    }
  }

  await visit(root)
  return files
}
