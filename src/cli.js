#!/usr/bin/env node
import path from "node:path"
import { indexRepository } from "./indexer.js"
import { startMcpServer } from "./mcp-server.js"
import { startWatcher } from "./watcher.js"
import { analyzeImpact, buildContextPack, getCallees, getCallers, loadGraph, normalizeContextType, normalizeTraceDepth, searchGraph, traceFlow } from "./graph.js"
import { asJson, compactCallResult, compactContextPack, compactImpactResult, shortNode } from "./format.js"
import { initProject, uninstallProject } from "./init.js"

const HELP = `open-context-map - mapa local de contexto para codigo

Uso:
  open-context-map index [repo]
  open-context-map watch [repo]
  open-context-map init [repo] [--source npx|global|local] [--package open-context-map@0.1.0] [--no-index]
  open-context-map uninstall [repo]
  open-context-map search <texto> [repo]
  open-context-map callers <simbolo> [repo]
  open-context-map callees <simbolo> [repo]
  open-context-map trace <simbolo> [repo] --depth 3
  open-context-map impact <simbolo> [repo] --depth 3
  open-context-map context <texto> [repo] --type bug|refactor|feature|general
  open-context-map mcp [repo]

Ejemplo:
  open-context-map index .
  open-context-map watch .
  open-context-map init .
  open-context-map uninstall .
  open-context-map impact UserService --depth 4
  open-context-map context OrderService --type bug
`

async function main() {
  const [command, firstArg, ...tail] = process.argv.slice(2)
  if (!command || command === "help" || command === "--help") {
    process.stdout.write(HELP)
    return
  }

  if (command === "index") {
    const repo = firstArg ?? "."
    const graph = await indexRepository(repo)
    process.stdout.write(asJson({ ok: true, message: "Indice creado", stats: graph.stats }))
    return
  }

  if (command === "watch") {
    const repo = firstArg ?? "."
    process.stderr.write(`Observando cambios en: ${path.resolve(repo)}\n`)
    const watcher = await startWatcher(repo)
    const stop = () => { watcher.stop(); process.exit(0) }
    process.on("SIGTERM", stop)
    process.on("SIGINT", stop)
    return
  }

  if (command === "init") {
    const parsedInit = parseTail([firstArg, ...tail].filter(Boolean))
    const repo = parsedInit.positionals[0] ?? "."
    const result = await initProject(repo, {
      source: parsedInit.flags.source ?? "npx",
      packageSpec: parsedInit.flags.package ?? undefined,
      writeIndex: parsedInit.flags["no-index"] !== true,
    })
    process.stdout.write(asJson(result))
    return
  }

  if (command === "uninstall") {
    const parsedUninstall = parseTail([firstArg, ...tail].filter(Boolean))
    const repo = parsedUninstall.positionals[0] ?? "."
    const result = await uninstallProject(repo)
    process.stdout.write(asJson(result))
    return
  }

  if (command === "mcp") {
    await startMcpServer(firstArg ?? ".")
    return
  }

  if (!firstArg) throw new Error(`Falta argumento.\n\n${HELP}`)

  const parsedArgs = parseTail(tail)
  const repo = parsedArgs.positionals[0] ?? "."
  const graph = await loadGraphOrCreate(repo)

  if (command === "search") {
    process.stdout.write(asJson(searchGraph(graph, firstArg, 20).map((item) => ({ score: item.score, node: shortNode(item.node) }))))
    return
  }

  if (command === "callers") {
    process.stdout.write(asJson(compactCallResult(getCallers(graph, firstArg), "caller")))
    return
  }

  if (command === "callees") {
    process.stdout.write(asJson(compactCallResult(getCallees(graph, firstArg), "callee")))
    return
  }

  if (command === "trace") {
    const depth = normalizeTraceDepth(parsedArgs.flags.depth)
    const result = traceFlow(graph, firstArg, depth)
    process.stdout.write(asJson({ start: shortNode(result.start), paths: result.paths.map((path) => path.map(shortNode)) }))
    return
  }

  if (command === "impact") {
    const depth = normalizeTraceDepth(parsedArgs.flags.depth)
    process.stdout.write(asJson(compactImpactResult(analyzeImpact(graph, firstArg, depth))))
    return
  }

  if (command === "context") {
    const type = normalizeContextType(parsedArgs.flags.type)
    process.stdout.write(asJson(compactContextPack(buildContextPack(graph, firstArg, type))))
    return
  }

  throw new Error(`Comando desconocido: ${command}\n\n${HELP}`)
}

async function loadGraphOrCreate(repo) {
  try {
    return await loadGraph(repo)
  } catch (error) {
    if (error.code !== "ENOENT") throw error
    return await indexRepository(repo)
  }
}

function parseTail(args) {
  const flags = {}
  const positionals = []

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (!value.startsWith("--")) {
      positionals.push(value)
      continue
    }

    const key = value.slice(2)
    const next = args[index + 1]
    if (next && !next.startsWith("--")) {
      flags[key] = next
      index += 1
    } else {
      flags[key] = true
    }
  }

  return { flags, positionals }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
