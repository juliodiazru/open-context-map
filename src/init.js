import { access, appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { indexRepository } from "./indexer.js"
import { INDEX_DIR, safeRepoRoot } from "./security.js"

const PACKAGE_NAME = "open-context-map"
const PACKAGE_VERSION = "0.1.0"
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
    nextStep: "Reinicia opencode en este proyecto para que vuelva a cargar opencode.json y los archivos de .opencode.",
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
    nextStep: "Reinicia opencode en este proyecto para que vuelva a cargar el opencode.json actualizado.",
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
  if (source === "global") return [PACKAGE_NAME, "mcp", "."]
  if (source === "local") return [process.execPath, localCliPath(), "mcp", "."]
  throw new Error(`Fuente de instalacion no soportada: ${source}. Usa pnpm, global o local.`)
}

function normalizePackageSpec(source, packageSpec) {
  if (source !== "pnpm") return packageSpec
  if (/^open-context-map(?:@[A-Za-z0-9][A-Za-z0-9._-]*)?$/.test(packageSpec)) return packageSpec
  throw new Error("El valor de --package debe ser open-context-map o open-context-map@version para evitar ejecutar paquetes inesperados.")
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
    throw new Error(`${filePath} no es JSON/JSONC valido. Corrigelo antes de ejecutar init. ${error.message}`)
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
description: Usa esta skill cuando necesites entender el contexto del repositorio antes de editar archivos.
---

# Open Context Map First

Usa esta skill cuando necesites entender codigo antes de cambiarlo.

## Regla

Usa primero el MCP \`open-context-map\` para bugs, refactors, features, impacto y explicaciones de flujo.

## Flujo sugerido

1. Crea un paquete de contexto para el simbolo o tema pedido.
2. Si hace falta, revisa callers, callees y el flujo.
3. Lee los archivos reales que el mapa señale.
4. Edita solo despues de revisar el codigo fuente.

Mientras el MCP este activo, el indice se actualiza solo cuando cambian archivos.

El grafo ayuda a orientarte, pero no reemplaza leer el codigo real.
`
}

function bugCommandTemplate() {
  return `---
description: Crea contexto de bug con open-context-map
agent: context-first
subtask: true
---

Necesito entender un posible bug alrededor de \`$ARGUMENTS\`.

Usa primero el MCP \`open-context-map\` y crea contexto de tipo \`bug\`.

Entrega final:

- que hace esta pieza
- donde empieza el flujo
- quien la llama
- que llama despues
- que archivos conviene leer
- que pruebas parecen relacionadas
`
}

function explainFlowCommandTemplate() {
  return `---
description: Explica un flujo usando open-context-map
agent: context-first
subtask: true
---

Quiero entender el flujo que empieza en \`$ARGUMENTS\`.

Usa el MCP \`open-context-map\` para trazar el flujo, revisar callers/callees si hace falta y explicarlo para una persona principiante.

Entrega final:

- simbolo inicial
- pasos principales del flujo
- archivos importantes
- huecos que todavia hay que verificar en codigo real
`
}

function contextFirstAgentTemplate() {
  return `---
description: Analiza contexto del repositorio con open-context-map antes de editar codigo.
mode: subagent
permission:
  edit: deny
  bash: deny
---

Tu trabajo es entender el contexto antes de que otro agente cambie codigo.

Flujo recomendado:

1. Usa primero el MCP \`open-context-map\`.
2. Resume simbolos, callers, callees, archivos y pruebas relacionadas.
3. Explica el resultado en lenguaje simple.
4. Propone los siguientes archivos a leer.
5. No edites archivos.

Recuerda que el mapa se actualiza solo mientras el MCP esta corriendo.
`
}
