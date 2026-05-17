import { execFile } from "node:child_process"
import { once } from "node:events"
import { fileURLToPath } from "node:url"
import { access } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"
import process from "node:process"
import { spawn } from "node:child_process"

const execFileAsync = promisify(execFile)
const scriptPath = fileURLToPath(import.meta.url)
const toolRoot = path.resolve(path.dirname(scriptPath), "..")
const projectRoot = process.env.INTEREST_LAB_PATH ?? path.resolve(toolRoot, "../interest-lab-java")
const cliPath = path.resolve(toolRoot, "src/cli.js")

async function checkProjectExists() {
  try {
    await access(projectRoot)
    return true
  } catch {
    return false
  }
}

async function validateCli() {
  const init = await runCli(["init", projectRoot, "--source", "local"])
  assert(init.ok === true, "init should succeed")
  assert(init.stats.files >= 9, "init should index Java sources and tests")

  const context = await runCli(["context", "InterestReportService", projectRoot, "--type", "bug"])
  assert(
    context.traceStart?.name === "InterestReportService.buildAnnualReport",
    "CLI bug context should start the flow at InterestReportService.buildAnnualReport"
  )
  assert(
    context.relatedTests.some((file) => file.path.endsWith("InterestReportServiceTest.java")),
    "CLI bug context should reference InterestReportServiceTest.java"
  )
  assert(
    context.flowPaths.some((path) => path.some((node) => node.name === "RatePolicy.normalizeAnnualRate")),
    "CLI bug context should include deeper rate policy impact"
  )

  const trace = await runCli(["trace", "InterestController.simulate", projectRoot, "--depth", "4"])
  assert(trace.paths.some((path) => path.some((node) => node.name === "InterestReportService.buildAnnualReport")), "trace should reach InterestReportService.buildAnnualReport")
  assert(trace.paths.some((path) => path.some((node) => node.name === "InterestCalculator.calculateCompoundInterest")), "trace should reach compound interest calculation")
}

async function validateMcp() {
  const client = new McpClient(cliPath, projectRoot)
  try {
    const initializeResult = await client.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "interest-lab-validator", version: "0.1.0" },
    })
    assert(initializeResult.serverInfo?.name === "open-context-map", "MCP initialize should identify open-context-map")

    client.notify("notifications/initialized", {})

    const tools = await client.request("tools/list", {})
    assert(tools.tools.some((tool) => tool.name === "build_context_pack"), "MCP should expose build_context_pack")

    const contextPack = await client.callTool("build_context_pack", {
      query: "InterestReportService",
      type: "bug",
    })
    assert(
      contextPack.traceStart?.name === "InterestReportService.buildAnnualReport",
      "MCP context should start the flow at InterestReportService.buildAnnualReport"
    )
    assert(
      contextPack.callers.some((item) => item.caller?.name === "InterestController.simulate"),
      "MCP context should include InterestController.simulate as caller"
    )
    assert(
      contextPack.callees.some((item) => item.callee?.name === "InterestCalculator.calculateCompoundInterest"),
      "MCP context should include InterestCalculator.calculateCompoundInterest as callee"
    )
  } finally {
    await client.close()
  }
}

async function runCli(args) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [cliPath, ...args], {
    cwd: toolRoot,
  })
  if (stderr) process.stderr.write(stderr)
  return JSON.parse(stdout)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

class McpClient {
  constructor(cliPath, repoPath) {
    this.nextId = 1
    this.pending = new Map()
    this.buffer = Buffer.alloc(0)
    this.child = spawn(process.execPath, [cliPath, "mcp", repoPath], {
      cwd: repoPath,
      stdio: ["pipe", "pipe", "pipe"],
    })

    this.child.stdout.on("data", (chunk) => this.onData(chunk))
    this.child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk)
    })
  }

  request(method, params) {
    const id = this.nextId
    this.nextId += 1
    const response = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
    this.send({ jsonrpc: "2.0", id, method, params })
    return response
  }

  notify(method, params) {
    this.send({ jsonrpc: "2.0", method, params })
  }

  async callTool(name, args) {
    const result = await this.request("tools/call", { name, arguments: args })
    const content = result.content?.[0]?.text
    assert(typeof content === "string", `Tool ${name} should return JSON text content`)
    return JSON.parse(content)
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n")
      if (headerEnd === -1) return

      const header = this.buffer.slice(0, headerEnd).toString("utf8")
      const match = header.match(/Content-Length:\s*(\d+)/i)
      if (!match) throw new Error("Missing Content-Length in MCP response")

      const contentLength = Number(match[1])
      const bodyStart = headerEnd + 4
      const bodyEnd = bodyStart + contentLength
      if (this.buffer.length < bodyEnd) return

      const body = this.buffer.slice(bodyStart, bodyEnd).toString("utf8")
      this.buffer = this.buffer.slice(bodyEnd)

      const message = JSON.parse(body)
      if (message.id === undefined) continue

      const pending = this.pending.get(message.id)
      if (!pending) continue
      this.pending.delete(message.id)

      if (message.error) {
        pending.reject(new Error(message.error.message))
      } else {
        pending.resolve(message.result)
      }
    }
  }

  send(payload) {
    const body = JSON.stringify(payload)
    this.child.stdin.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`)
  }

  async close() {
    this.child.stdin.end()
    this.child.kill()
    await once(this.child, "exit")
  }
}

const projectExists = await checkProjectExists()
if (!projectExists) {
  process.stdout.write(
    `open-context-map interest-lab validation skipped: companion project not found at ${projectRoot}\n` +
    `Set the INTEREST_LAB_PATH environment variable to point to your interest-lab-java directory.\n`
  )
  process.exit(0)
}

await validateCli()
await validateMcp()

process.stdout.write("open-context-map interest-lab validation passed\n")
