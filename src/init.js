import { access, appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { indexRepository } from "./indexer.js"
import { INDEX_DIR, safeRepoRoot } from "./security.js"

const PACKAGE_NAME = "@juliodiazru/open-context-map"
const GLOBAL_BIN_NAME = "open-context-map"
const PACKAGE_VERSION = "0.1.2"
const MCP_NAME = "open-context-map"

export async function initProject(repoPath = process.cwd(), options = {}) {
  const root = safeRepoRoot(repoPath)
  const source = options.source ?? "pnpm"
  const packageSpec = normalizePackageSpec(source, options.packageSpec ?? `${PACKAGE_NAME}@${PACKAGE_VERSION}`)
  const command = mcpCommandFor(source, packageSpec)

  await writeOpencodeConfig(root, command)
  await writeOpencodeFiles(root)
  await ensureGitignore(root)

  const graph = options.writeIndex === false ? null : await indexRepository(root)

  return {
    ok: true,
    repo: root,
    mcp: MCP_NAME,
    command,
    files: [
      "opencode.json",
      ".opencode/skills/open-context-map-first/SKILL.md",
      ".opencode/commands/bug-context.md",
      ".opencode/commands/explain-flow.md",
      ".opencode/agents/context-first.md",
      ".gitignore",
    ],
    index: graph ? ".open-context-map/index.json" : null,
    stats: graph?.stats ?? null,
    nextStep: "Restart opencode in this project so it reloads opencode.json and the files under .opencode.",
  }
}

export async function uninstallProject(repoPath = process.cwd()) {
  const root = safeRepoRoot(repoPath)
  const removed = []

  await rm(path.join(root, INDEX_DIR), { recursive: true, force: true })
  removed.push(INDEX_DIR)

  await cleanOpencodeConfig(root, removed)
  await cleanOpencodeFiles(root, removed)
  await cleanGitignore(root)

  return {
    ok: true,
    repo: root,
    removed,
    nextStep: "Restart opencode in this project so it reloads the updated opencode.json.",
  }
}

async function cleanOpencodeConfig(root, removed) {
  const configPath = await opencodeConfigPath(root)
  const config = await readJsonIfExists(configPath)
  if (!config.mcp?.[MCP_NAME]) return
  delete config.mcp[MCP_NAME]
  if (Object.keys(config.mcp).length === 0) delete config.mcp
  if (config.watcher?.ignore) {
    config.watcher.ignore = config.watcher.ignore.filter((entry) => entry !== ".open-context-map/**")
    if (config.watcher.ignore.length === 0) delete config.watcher.ignore
    if (Object.keys(config.watcher).length === 0) delete config.watcher
  }
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
  removed.push(path.basename(configPath))
}

async function cleanOpencodeFiles(root, removed) {
  const targets = [
    ".opencode/skills/open-context-map-first",
    ".opencode/commands/bug-context.md",
    ".opencode/commands/explain-flow.md",
    ".opencode/agents/context-first.md",
  ]
  for (const target of targets) {
    const fullPath = path.join(root, target)
    await rm(fullPath, { recursive: true, force: true })
    removed.push(target)
  }
}

async function cleanGitignore(root) {
  const gitignorePath = path.join(root, ".gitignore")
  const existing = await readTextIfExists(gitignorePath)
  if (existing === null) return
  const cleaned = existing.split(/\r?\n/).filter((line) => line !== ".open-context-map/").join("\n")
  if (cleaned === existing) return
  const withNewline = cleaned.length > 0 && !cleaned.endsWith("\n") ? `${cleaned}\n` : cleaned
  await writeFile(gitignorePath, withNewline)
}

function mcpCommandFor(source, packageSpec) {
  if (source === "pnpm") return ["pnpm", "dlx", packageSpec, "mcp", "."]
  if (source === "global") return [GLOBAL_BIN_NAME, "mcp", "."]
  if (source === "local") return [process.execPath, localCliPath(), "mcp", "."]
  throw new Error(`Unsupported install source: ${source}. Use pnpm, global, or local.`)
}

function normalizePackageSpec(source, packageSpec) {
  if (source !== "pnpm") return packageSpec
  if (/^@juliodiazru\/open-context-map(?:@[A-Za-z0-9][A-Za-z0-9._-]*)?$/.test(packageSpec)) return packageSpec
  throw new Error("The --package value must be @juliodiazru/open-context-map or @juliodiazru/open-context-map@version to avoid running unexpected packages.")
}

function localCliPath() {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "cli.js")
}

async function writeOpencodeConfig(root, command) {
  const configPath = await opencodeConfigPath(root)
  const config = await readJsonIfExists(configPath)
  config.$schema ??= "https://opencode.ai/config.json"
  config.mcp ??= {}
  config.mcp[MCP_NAME] = {
    type: "local",
    command,
    enabled: true,
    timeout: 15000,
  }

  config.watcher ??= {}
  config.watcher.ignore = mergeUnique(config.watcher.ignore ?? [], [
    ".open-context-map/**",
    "node_modules/**",
    ".gradle/**",
    "build/**",
    "target/**",
    "dist/**",
  ])

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
}

async function opencodeConfigPath(root) {
  const jsonPath = path.join(root, "opencode.json")
  const jsoncPath = path.join(root, "opencode.jsonc")
  if (await exists(jsonPath)) return jsonPath
  if (await exists(jsoncPath)) return jsoncPath
  return jsonPath
}

async function writeOpencodeFiles(root) {
  await writeProjectFile(root, ".opencode/skills/open-context-map-first/SKILL.md", skillTemplate())
  await writeProjectFile(root, ".opencode/commands/bug-context.md", bugCommandTemplate())
  await writeProjectFile(root, ".opencode/commands/explain-flow.md", explainFlowCommandTemplate())
  await writeProjectFile(root, ".opencode/agents/context-first.md", contextFirstAgentTemplate())
}

async function writeProjectFile(root, relativePath, content) {
  const outputPath = path.join(root, relativePath)
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 })
  await writeFile(outputPath, content, { mode: 0o600 })
}

async function ensureGitignore(root) {
  const gitignorePath = path.join(root, ".gitignore")
  const existing = await readTextIfExists(gitignorePath)
  if (existing === null) {
    await writeFile(gitignorePath, ".open-context-map/\n", { mode: 0o600 })
    return
  }
  if (!existing.split(/\r?\n/).includes(".open-context-map/")) {
    const prefix = existing.endsWith("\n") || existing.length === 0 ? "" : "\n"
    await appendFile(gitignorePath, `${prefix}.open-context-map/\n`)
  }
}

async function readJsonIfExists(filePath) {
  const text = await readTextIfExists(filePath)
  if (text === null) return {}
  try {
    return JSON.parse(stripJsonCommentsAndTrailingCommas(text))
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON/JSONC. Fix it before running init. ${error.message}`)
  }
}

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

async function readTextIfExists(filePath) {
  try {
    await access(filePath)
    return await readFile(filePath, "utf8")
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
}

function mergeUnique(first, second) {
  return [...new Set([...first, ...second])]
}

function stripJsonCommentsAndTrailingCommas(text) {
  let output = ""
  let inString = false
  let quote = ""
  let escaped = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (inString) {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === quote) {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      quote = char
      output += char
      continue
    }

    if (char === "/" && next === "/") {
      while (index < text.length && text[index] !== "\n") index += 1
      output += "\n"
      continue
    }

    if (char === "/" && next === "*") {
      index += 2
      while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) index += 1
      index += 1
      continue
    }

    output += char
  }

  return output.replace(/,\s*([}\]])/g, "$1")
}

function skillTemplate() {
  return `---
name: open-context-map-first
description: Use this skill when you need to understand repository context before editing files.
---

# Open Context Map First

Use this skill when you need to understand code before changing it.

## Rule

Use the \`open-context-map\` MCP first for bugs, refactors, features, impact analysis, and flow explanations.

## Suggested Flow

1. Build a context pack for the requested symbol or topic.
2. If needed, inspect callers, callees, and trace flow.
3. Read the real files that the map points to.
4. Edit only after checking the source files.

While the MCP is active, the index updates itself when files change.

The graph helps you orient yourself, but it does not replace reading the real code.
`
}

function bugCommandTemplate() {
  return `---
description: Build bug context with open-context-map
agent: context-first
subtask: true
---

I need to understand a possible bug around \`$ARGUMENTS\`.

Use the \`open-context-map\` MCP first and build context of type \`bug\`.

Final output:

- what this piece does
- where the flow starts
- who calls it
- what it calls next
- which files are worth reading
- which tests look related
`
}

function explainFlowCommandTemplate() {
  return `---
description: Explain a flow using open-context-map
agent: context-first
subtask: true
---

I want to understand the flow that starts at \`$ARGUMENTS\`.

Use the \`open-context-map\` MCP to trace the flow, inspect callers and callees if needed, and explain it for a beginner.

Final output:

- starting symbol
- main flow steps
- important files
- gaps that still need to be verified in real code
`
}

function contextFirstAgentTemplate() {
  return `---
description: Analyze repository context with open-context-map before editing code.
mode: subagent
permission:
  edit: deny
  bash: deny
---

Your job is to understand context before another agent changes code.

Recommended flow:

1. Use the \`open-context-map\` MCP first.
2. Summarize symbols, callers, callees, files, and related tests.
3. Explain the result in simple language.
4. Propose the next files to read.
5. Do not edit files.

Remember that the map updates automatically while the MCP is running.
`
}
