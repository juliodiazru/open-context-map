import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseSourceFile } from "./parser.js"
import {
  indexPathFor,
  normalizePath,
  readTextFileSafely,
  safeRepoRoot,
  sha256,
  walkSourceFiles,
} from "./security.js"

export async function indexRepository(repoPath = process.cwd(), options = {}) {
  const root = safeRepoRoot(repoPath)
  const sourceFiles = await walkSourceFiles(root, options)
  const files = []
  const nodes = []
  const edges = []
  const callEvents = []
  const symbolsByShortName = new Map()
  const symbolsByFullName = new Map()

  for (const fullPath of sourceFiles) {
    const text = await readTextFileSafely(fullPath, options.maxFileBytes)
    if (text === null) continue

    const relativePath = normalizePath(path.relative(root, fullPath))
    const fileId = fileNodeId(relativePath)
    const parsed = parseSourceFile(relativePath, text)
    const fileNode = {
      id: fileId,
      type: "file",
      name: relativePath,
      file: relativePath,
      language: parsed.language,
      line: 1,
    }

    files.push({
      path: relativePath,
      language: parsed.language,
      bytes: Buffer.byteLength(text, "utf8"),
      lines: parsed.lineCount,
      sha256: sha256(text),
    })
    nodes.push(fileNode)

    for (const sourceImport of parsed.imports) {
      const externalId = externalNodeId(sourceImport.target)
      nodes.push({ id: externalId, type: "external", name: sourceImport.target })
      edges.push({ from: fileId, to: externalId, type: "imports", line: sourceImport.line, confidence: "medium" })
    }

    for (const parsedSymbol of parsed.symbols) {
      const symbolNode = {
        id: symbolNodeId(relativePath, parsedSymbol.name, parsedSymbol.line),
        type: "symbol",
        kind: parsedSymbol.kind,
        name: parsedSymbol.name,
        shortName: parsedSymbol.shortName,
        file: relativePath,
        line: parsedSymbol.line,
        endLine: parsedSymbol.endLine,
        signature: parsedSymbol.signature,
      }
      nodes.push(symbolNode)
      edges.push({ from: fileId, to: symbolNode.id, type: "declares", line: parsedSymbol.line, confidence: "high" })
      addToMap(symbolsByShortName, parsedSymbol.shortName, symbolNode)
      addToMap(symbolsByFullName, parsedSymbol.name, symbolNode)
    }

    for (const callEvent of parsed.calls) {
      callEvents.push({ file: relativePath, fileId, ...callEvent })
    }
  }

  for (const callEvent of callEvents) {
    const caller = resolveCaller(callEvent, symbolsByFullName, symbolsByShortName)
    const targets = symbolsByShortName.get(callEvent.name) ?? []
    if (targets.length === 0) continue
    for (const target of targets.slice(0, 8)) {
      if (caller === target.id) continue
      edges.push({
        from: caller,
        to: target.id,
        type: "calls",
        line: callEvent.line,
        confidence: targets.length === 1 ? "medium" : "low",
        detail: callEvent.text,
      })
    }
  }

  const uniqueNodes = [...new Map(nodes.map((node) => [node.id, node])).values()]
  const graph = {
    version: 1,
    tool: "open-context-map",
    createdAt: new Date().toISOString(),
    repoRoot: root,
    stats: {
      files: files.length,
      nodes: uniqueNodes.length,
      edges: edges.length,
    },
    files,
    nodes: uniqueNodes,
    edges,
  }

  if (options.write !== false) await writeIndex(root, graph)
  return graph
}

export async function reindexFiles(repoPath, changedPaths, options = {}) {
  const root = safeRepoRoot(repoPath)
  const indexPath = indexPathFor(root)

  let graph
  try {
    graph = JSON.parse(await readFile(indexPath, "utf8"))
  } catch (err) {
    if (err.code !== "ENOENT") throw err
    return indexRepository(repoPath, options)
  }

  const relPaths = changedPaths
    .map((fp) => normalizePath(path.relative(root, fp)))
    .filter((rel) => !rel.startsWith("..") && !rel.startsWith("/"))

  if (relPaths.length === 0) return graph

  const fileMap = new Map(graph.files.map((f) => [f.path, f]))
  const toReparse = []

  for (const rel of relPaths) {
    let text
    try {
      text = await readTextFileSafely(path.join(root, rel), options.maxFileBytes)
    } catch (err) {
      if (err.code !== "ENOENT") throw err
      text = null
    }
    if (text === null) {
      toReparse.push({ rel, text: null, hash: null })
      continue
    }
    const hash = sha256(text)
    if (fileMap.get(rel)?.sha256 === hash) continue
    toReparse.push({ rel, text, hash })
  }

  if (toReparse.length === 0) return graph

  const changedRels = new Set(toReparse.map((item) => item.rel))
  const removedIds = new Set(graph.nodes.filter((n) => n.file && changedRels.has(n.file)).map((n) => n.id))

  graph.nodes = graph.nodes.filter((n) => !removedIds.has(n.id))
  graph.edges = graph.edges.filter((e) => !removedIds.has(e.from) && !removedIds.has(e.to))
  graph.files = graph.files.filter((f) => !changedRels.has(f.path))

  const symbolsByShortName = symbolsByShortNameFromNodes(graph.nodes)
  const symbolsByFullName = symbolsByFullNameFromNodes(graph.nodes)
  const callEvents = []

  for (const { rel, text, hash } of toReparse) {
    if (text === null) continue
    const fileId = fileNodeId(rel)
    const parsed = parseSourceFile(rel, text)

    graph.files.push({ path: rel, language: parsed.language, bytes: Buffer.byteLength(text, "utf8"), lines: parsed.lineCount, sha256: hash })
    graph.nodes.push({ id: fileId, type: "file", name: rel, file: rel, language: parsed.language, line: 1 })

    for (const sourceImport of parsed.imports) {
      const externalId = externalNodeId(sourceImport.target)
      if (!graph.nodes.some((n) => n.id === externalId)) {
        graph.nodes.push({ id: externalId, type: "external", name: sourceImport.target })
      }
      graph.edges.push({ from: fileId, to: externalId, type: "imports", line: sourceImport.line, confidence: "medium" })
    }

    for (const parsedSymbol of parsed.symbols) {
      const symbolNode = {
        id: symbolNodeId(rel, parsedSymbol.name, parsedSymbol.line),
        type: "symbol",
        kind: parsedSymbol.kind,
        name: parsedSymbol.name,
        shortName: parsedSymbol.shortName,
        file: rel,
        line: parsedSymbol.line,
        endLine: parsedSymbol.endLine,
        signature: parsedSymbol.signature,
      }
      graph.nodes.push(symbolNode)
      graph.edges.push({ from: fileId, to: symbolNode.id, type: "declares", line: parsedSymbol.line, confidence: "high" })
      addToMap(symbolsByShortName, parsedSymbol.shortName, symbolNode)
      addToMap(symbolsByFullName, parsedSymbol.name, symbolNode)
    }

    for (const callEvent of parsed.calls) {
      callEvents.push({ file: rel, fileId, ...callEvent })
    }
  }

  for (const callEvent of callEvents) {
    const caller = resolveCaller(callEvent, symbolsByFullName, symbolsByShortName)
    const targets = symbolsByShortName.get(callEvent.name) ?? []
    if (targets.length === 0) continue
    for (const target of targets.slice(0, 8)) {
      if (caller === target.id) continue
      graph.edges.push({ from: caller, to: target.id, type: "calls", line: callEvent.line, confidence: targets.length === 1 ? "medium" : "low", detail: callEvent.text })
    }
  }

  const uniqueNodes = [...new Map(graph.nodes.map((n) => [n.id, n])).values()]
  graph.nodes = uniqueNodes
  graph.stats = { files: graph.files.length, nodes: uniqueNodes.length, edges: graph.edges.length }
  graph.createdAt = new Date().toISOString()

  if (options.write !== false) await writeIndex(root, graph)
  return graph
}

export async function writeIndex(root, graph) {
  const outputPath = indexPathFor(root)
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 })
  await writeFile(outputPath, `${JSON.stringify(graph, null, 2)}\n`, { mode: 0o600 })
  return outputPath
}

export function fileNodeId(relativePath) {
  return `file:${relativePath}`
}

export function symbolNodeId(relativePath, name, line) {
  return `symbol:${relativePath}:${name}:${line}`
}

function externalNodeId(name) {
  return `external:${name}`
}

function addToMap(map, key, value) {
  const values = map.get(key) ?? []
  values.push(value)
  map.set(key, values)
}

function symbolsByShortNameFromNodes(nodes) {
  const map = new Map()
  for (const node of nodes) {
    if (node.type === "symbol") addToMap(map, node.shortName, node)
  }
  return map
}

function symbolsByFullNameFromNodes(nodes) {
  const map = new Map()
  for (const node of nodes) {
    if (node.type === "symbol") addToMap(map, node.name, node)
  }
  return map
}

function resolveCaller(callEvent, symbolsByFullName, symbolsByShortName) {
  if (!callEvent.callerName) return callEvent.fileId
  const fullMatches = symbolsByFullName.get(callEvent.callerName) ?? []
  const localMatch = fullMatches.find((item) => item.file === callEvent.file)
  if (localMatch) return localMatch.id
  const shortName = callEvent.callerName.split(".").at(-1)
  const shortMatches = symbolsByShortName.get(shortName) ?? []
  return shortMatches.find((item) => item.file === callEvent.file)?.id ?? callEvent.fileId
}
