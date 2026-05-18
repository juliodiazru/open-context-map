import { indexRepository } from "./indexer.js"
import { analyzeImpact, buildContextPack, getCallees, getCallers, loadGraph, normalizeContextType, normalizeTraceDepth, searchGraph, traceFlow } from "./graph.js"
import { compactCallResult, compactContextPack, compactImpactResult, shortNode } from "./format.js"
import { resolveInside, safeRepoRoot } from "./security.js"
import { startWatcher } from "./watcher.js"

const PROTOCOL_VERSION = "2024-11-05"

export async function startMcpServer(defaultRepo = ".") {
  const server = new McpStdioServer(defaultRepo)
  await server.start()
}

class McpStdioServer {
  constructor(defaultRepo) {
    this.defaultRepo = safeRepoRoot(defaultRepo)
    this.buffer = Buffer.alloc(0)
  }

  async start() {
    this.watcher = await startWatcher(this.defaultRepo)
    const stop = () => { this.watcher.stop(); process.exit(0) }
    process.on("SIGTERM", stop)
    process.on("SIGINT", stop)
    process.stdin.on("data", (chunk) => this.onData(chunk))
    process.stdin.on("error", () => process.exit(1))
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (true) {
      const message = this.readMessage()
      if (!message) break
      this.handleMessage(message).catch((error) => {
        if (message.id !== undefined) this.sendError(message.id, -32603, error.message)
      })
    }
  }

  readMessage() {
    const headerEnd = this.buffer.indexOf("\r\n\r\n")
    const nextLine = this.buffer.indexOf("\n")
    if (headerEnd !== -1 && (nextLine === -1 || headerEnd < nextLine || this.buffer.toString("utf8", 0, nextLine).startsWith("Content-Length:"))) {
      const header = this.buffer.slice(0, headerEnd).toString("utf8")
      const match = header.match(/Content-Length:\s*(\d+)/i)
      if (!match) throw new Error("Mensaje MCP sin Content-Length")
      const length = Number(match[1])
      const bodyStart = headerEnd + 4
      const bodyEnd = bodyStart + length
      if (this.buffer.length < bodyEnd) return null
      const body = this.buffer.slice(bodyStart, bodyEnd).toString("utf8")
      this.buffer = this.buffer.slice(bodyEnd)
      return JSON.parse(body)
    }

    const newline = this.buffer.indexOf("\n")
    if (newline === -1) return null
    const line = this.buffer.slice(0, newline).toString("utf8").trim()
    this.buffer = this.buffer.slice(newline + 1)
    if (!line) return null
    return JSON.parse(line)
  }

  async handleMessage(message) {
    if (message.method === "notifications/initialized") return

    if (message.method === "initialize") {
      this.sendResult(message.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "open-context-map", version: "0.1.2" },
      })
      return
    }

    if (message.method === "tools/list") {
      this.sendResult(message.id, { tools: toolsList() })
      return
    }

    if (message.method === "tools/call") {
      const result = await this.callTool(message.params?.name, message.params?.arguments ?? {})
      this.sendResult(message.id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: false,
      })
      return
    }

    if (message.id !== undefined) this.sendError(message.id, -32601, `Metodo no soportado: ${message.method}`)
  }

  async callTool(name, args) {
    const repo = this.resolveRepoArg(args.repoPath)

    if (name === "index_repo") {
      const graph = await indexRepository(repo)
      return { ok: true, stats: graph.stats, index: ".open-context-map/index.json" }
    }

    const graph = await this.loadGraphOrCreate(repo)

    if (name === "search_code_graph") {
      return searchGraph(graph, args.query, args.limit ?? 20).map((item) => ({ score: item.score, node: shortNode(item.node) }))
    }
    if (name === "get_symbol") {
      return searchGraph(graph, args.symbol, 10).map((item) => ({ score: item.score, node: shortNode(item.node) }))
    }
    if (name === "find_callers") return compactCallResult(getCallers(graph, args.symbol), "caller")
    if (name === "find_callees") return compactCallResult(getCallees(graph, args.symbol), "callee")
    if (name === "trace_flow") {
      const result = traceFlow(graph, args.symbol, normalizeTraceDepth(args.depth))
      return { start: shortNode(result.start), paths: result.paths.map((path) => path.map(shortNode)) }
    }
    if (name === "analyze_impact") return compactImpactResult(analyzeImpact(graph, args.symbol, normalizeTraceDepth(args.depth)))
    if (name === "build_context_pack") return compactContextPack(buildContextPack(graph, args.query, normalizeContextType(args.type)))

    throw new Error(`Tool no soportada: ${name}`)
  }

  resolveRepoArg(repoPath) {
    if (!repoPath) return this.defaultRepo
    return resolveInside(this.defaultRepo, repoPath)
  }

  async loadGraphOrCreate(repo) {
    try {
      return await loadGraph(repo)
    } catch (error) {
      if (error.code !== "ENOENT") throw error
      return await indexRepository(repo)
    }
  }

  sendResult(id, result) {
    this.send({ jsonrpc: "2.0", id, result })
  }

  sendError(id, code, message) {
    this.send({ jsonrpc: "2.0", id, error: { code, message } })
  }

  send(payload) {
    process.stdout.write(`${JSON.stringify(payload)}\n`)
  }
}

function toolsList() {
  return [
    tool("index_repo", "Build the local repository index.", {
      repoPath: stringSchema("Repository path. If omitted, uses the configured folder."),
    }),
    tool("search_code_graph", "Search files and symbols in the code graph.", {
      query: stringSchema("Text to search for."),
      repoPath: stringSchema("Optional repository path."),
      limit: numberSchema("Maximum number of results."),
    }, ["query"]),
    tool("get_symbol", "Find a symbol by name.", {
      symbol: stringSchema("Symbol name."),
      repoPath: stringSchema("Optional repository path."),
    }, ["symbol"]),
    tool("find_callers", "Find who calls a symbol.", {
      symbol: stringSchema("Symbol name."),
      repoPath: stringSchema("Optional repository path."),
    }, ["symbol"]),
    tool("find_callees", "Find what a symbol calls next.", {
      symbol: stringSchema("Symbol name."),
      repoPath: stringSchema("Optional repository path."),
    }, ["symbol"]),
    tool("trace_flow", "Trace the flow from a symbol across multiple levels.", {
      symbol: stringSchema("Starting symbol name."),
      depth: numberSchema("Maximum depth."),
      repoPath: stringSchema("Optional repository path."),
    }, ["symbol"]),
    tool("analyze_impact", "Analyze the impact of changing a symbol: which other symbols depend on it directly or indirectly.", {
      symbol: stringSchema("Symbol name."),
      depth: numberSchema("Maximum backward search depth."),
      repoPath: stringSchema("Optional repository path."),
    }, ["symbol"]),
    tool("build_context_pack", "Build a context pack for bug, refactor, feature, or general tasks.", {
      query: stringSchema("Primary text or symbol."),
      type: stringSchema("Type: bug, refactor, feature, or general."),
      repoPath: stringSchema("Optional repository path."),
    }, ["query"]),
  ]
}

function tool(name, description, properties, required = []) {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
  }
}

function stringSchema(description) {
  return { type: "string", description }
}

function numberSchema(description) {
  return { type: "number", description }
}
