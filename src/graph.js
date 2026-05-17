import { readFile } from "node:fs/promises"
import { indexPathFor, safeRepoRoot } from "./security.js"

const ALLOWED_CONTEXT_TYPES = new Set(["bug", "refactor", "feature", "general"])
const DEFAULT_CONTEXT_TYPE = "general"
const DEFAULT_TRACE_DEPTH = 3
const MAX_TRACE_DEPTH = 8

export async function loadGraph(repoPath = process.cwd()) {
  const root = safeRepoRoot(repoPath)
  const raw = await readFile(indexPathFor(root), "utf8")
  return JSON.parse(raw)
}

export function createGraphIndex(graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))
  const outgoing = new Map()
  const incoming = new Map()

  for (const edge of graph.edges) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, [])
    if (!incoming.has(edge.to)) incoming.set(edge.to, [])
    outgoing.get(edge.from).push(edge)
    incoming.get(edge.to).push(edge)
  }

  return { graph, nodesById, outgoing, incoming }
}

export function searchGraph(graph, query, limit = 20) {
  const cleanQuery = normalizeQuery(query)
  if (!cleanQuery) return []

  return graph.nodes
    .map((node) => ({ node, score: scoreNode(node, cleanQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.node.name).localeCompare(String(b.node.name)))
    .slice(0, normalizeLimit(limit, 20, 100))
}

export function findSymbols(graph, query, limit = 10) {
  return searchGraph(graph, query, limit).filter((item) => item.node.type === "symbol")
}

export function getCallers(graph, query, limit = 30) {
  const index = createGraphIndex(graph)
  const symbols = findSymbols(graph, query, 8).map((item) => item.node)
  const results = []

  for (const symbol of symbols) {
    const incoming = index.incoming.get(symbol.id) ?? []
    for (const edge of incoming.filter((item) => item.type === "calls")) {
      results.push({ symbol, caller: index.nodesById.get(edge.from), edge })
    }
  }

  return results.slice(0, limit)
}

export function getCallees(graph, query, limit = 30) {
  const index = createGraphIndex(graph)
  const symbols = findSymbols(graph, query, 8).map((item) => item.node)
  const results = []

  for (const symbol of symbols) {
    const outgoing = index.outgoing.get(symbol.id) ?? []
    for (const edge of outgoing.filter((item) => item.type === "calls")) {
      results.push({ symbol, callee: index.nodesById.get(edge.to), edge })
    }
  }

  return results.slice(0, limit)
}

export function traceFlow(graph, query, maxDepth = DEFAULT_TRACE_DEPTH) {
  const index = createGraphIndex(graph)
  const start = findSymbols(graph, query, 1)[0]?.node
  if (!start) return { start: null, paths: [] }

  return traceFlowFromNode(index, start, maxDepth)
}

export function normalizeContextType(type) {
  return ALLOWED_CONTEXT_TYPES.has(type) ? type : DEFAULT_CONTEXT_TYPE
}

export function normalizeTraceDepth(depth, fallback = DEFAULT_TRACE_DEPTH) {
  const parsed = Number(depth)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(1, Math.min(MAX_TRACE_DEPTH, Math.trunc(parsed)))
}

function traceFlowFromNode(index, start, maxDepth = DEFAULT_TRACE_DEPTH) {
  const safeDepth = normalizeTraceDepth(maxDepth)

  const paths = []
  const queue = [{ node: start, path: [start], depth: 0 }]
  const seen = new Set([start.id])

  while (queue.length > 0) {
    const current = queue.shift()
    const calls = (index.outgoing.get(current.node.id) ?? []).filter((edge) => edge.type === "calls")
    if (calls.length === 0 || current.depth >= safeDepth) {
      paths.push(current.path)
      continue
    }

    for (const edge of calls.slice(0, 8)) {
      const next = index.nodesById.get(edge.to)
      if (!next || seen.has(`${current.node.id}->${next.id}`)) continue
      seen.add(`${current.node.id}->${next.id}`)
      queue.push({ node: next, path: [...current.path, next], depth: current.depth + 1 })
    }
  }

  return { start, paths: paths.slice(0, 20) }
}

export function analyzeImpact(graph, query, maxDepth = DEFAULT_TRACE_DEPTH) {
  const safeDepth = normalizeTraceDepth(maxDepth)
  const index = createGraphIndex(graph)
  const start = findSymbols(graph, query, 1)[0]?.node
  if (!start) return { start: null, impactedSymbols: [], impactPaths: [] }

  const visited = new Set([start.id])
  const impactedItems = []
  const queue = [{ node: start, path: [start], depth: 0 }]

  while (queue.length > 0) {
    const { node, path, depth } = queue.shift()
    if (depth >= safeDepth) continue
    const incomingCalls = (index.incoming.get(node.id) ?? []).filter((edge) => edge.type === "calls")
    for (const edge of incomingCalls.slice(0, 8)) {
      const caller = index.nodesById.get(edge.from)
      if (!caller || caller.type !== "symbol" || visited.has(caller.id)) continue
      visited.add(caller.id)
      const callerPath = [caller, ...path]
      impactedItems.push({ node: caller, path: callerPath })
      queue.push({ node: caller, path: callerPath, depth: depth + 1 })
    }
  }

  return {
    start,
    impactedSymbols: impactedItems.map((item) => item.node),
    impactPaths: impactedItems.slice(0, 20).map((item) => item.path),
  }
}

export function buildContextPack(graph, query, type = "general") {
  const safeType = normalizeContextType(type)
  const index = createGraphIndex(graph)
  const symbols = findSymbols(graph, query, 5).map((item) => item.node)
  const files = searchGraph(graph, query, 10)
    .map((item) => item.node)
    .filter((node) => node.type === "file")
  const callers = getCallers(graph, query, 20)
  const callees = getCallees(graph, query, 20)
  const traceStart = selectTraceStart(symbols, index)
  const trace = traceStart ? traceFlowFromNode(index, traceStart, safeType === "bug" ? 4 : 3) : { start: null, paths: [] }
  const tests = findRelatedTests(graph, [...symbols, ...files])

  return {
    type: safeType,
    query,
    explanation: explanationForType(safeType),
    mainSymbols: symbols,
    relevantFiles: files,
    callers,
    callees,
    traceStart: trace.start,
    flowPaths: trace.paths,
    relatedTests: tests,
    beginnerSummary: summarizeForBeginners(safeType, symbols, callers, callees, tests),
  }
}

function selectTraceStart(symbols, index) {
  const candidates = symbols
    .filter((node) => node.kind !== "class")
    .filter((node) => !isConstructorLike(node))
    .map((node) => ({ node, outgoingCalls: countOutgoingCalls(index, node.id) }))
    .filter((item) => item.outgoingCalls > 0)
    .sort((a, b) => b.outgoingCalls - a.outgoingCalls || a.node.line - b.node.line)

  return candidates[0]?.node ?? symbols[0] ?? null
}

function countOutgoingCalls(index, nodeId) {
  return (index.outgoing.get(nodeId) ?? []).filter((edge) => edge.type === "calls").length
}

function isConstructorLike(node) {
  const parts = String(node.name ?? "").split(".")
  return parts.length > 1 && parts.at(-1) === parts.at(-2)
}

function findRelatedTests(graph, nodes) {
  const words = new Set()
  for (const node of nodes) {
    for (const part of String(node.name).split(/[^A-Za-z0-9_]+/)) {
      if (part.length >= 4) words.add(part.toLowerCase())
    }
  }

  return graph.files
    .filter((file) => /(^|\/)(__tests__|tests?|spec)(\/|$)|\.(test|spec)\./.test(file.path))
    .map((file) => ({ file, score: [...words].filter((word) => file.path.toLowerCase().includes(word)).length }))
    .filter((item) => item.score > 0 || nodes.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => item.file)
}

function normalizeQuery(query) {
  return String(query ?? "").trim().toLowerCase()
}

function normalizeLimit(limit, fallback, max) {
  const parsed = Number(limit)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(1, Math.min(max, Math.trunc(parsed)))
}

function scoreNode(node, query) {
  const haystack = [node.name, node.shortName, node.file, node.signature, node.kind, node.language].filter(Boolean).join(" ").toLowerCase()
  if (haystack === query) return 100
  if (String(node.name).toLowerCase() === query) return 90
  if (String(node.shortName ?? "").toLowerCase() === query) return 80
  if (haystack.includes(query)) return 50
  return query
    .split(/\s+/)
    .filter((part) => part.length > 2 && haystack.includes(part)).length * 10
}

function explanationForType(type) {
  if (type === "bug") return "Paquete para arreglar un bug: mira quien llama, que se llama despues y que pruebas pueden fallar."
  if (type === "refactor") return "Paquete para refactor: mira impacto antes de cambiar nombres, clases o funciones."
  if (type === "feature") return "Paquete para feature: mira piezas parecidas para seguir el estilo del proyecto."
  return "Paquete general: junta simbolos, archivos y relaciones cercanas."
}

function summarizeForBeginners(type, symbols, callers, callees, tests) {
  return [
    `Tipo de tarea: ${type}.`,
    `Simbolos principales encontrados: ${symbols.length}.`,
    `Lugares que llaman a esos simbolos: ${callers.length}.`,
    `Lugares que esos simbolos llaman despues: ${callees.length}.`,
    `Pruebas relacionadas encontradas: ${tests.length}.`,
    "Lee primero los simbolos principales. Luego mira callers para entender de donde viene el flujo. Despues mira callees para saber que pasa al final.",
  ].join(" ")
}
