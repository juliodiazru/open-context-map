import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { indexRepository } from "../src/indexer.js"
import { analyzeImpact, buildContextPack, getCallees, getCallers, searchGraph, traceFlow } from "../src/graph.js"
import { initProject, uninstallProject } from "../src/init.js"

test("indexes functions and call relationships", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await mkdir(path.join(repo, "src"))
  await writeFile(
    path.join(repo, "src", "orders.js"),
    `export function placeOrder(input) {
  validateOrder(input)
  saveOrder(input)
}

function validateOrder(input) {
  return input
}

function saveOrder(input) {
  return input
}
`,
  )

  const graph = await indexRepository(repo, { write: false })
  assert.equal(graph.stats.files, 1)

  const found = searchGraph(graph, "placeOrder", 5)
  assert.equal(found[0].node.name, "placeOrder")

  const callees = getCallees(graph, "placeOrder")
  assert.ok(callees.some((item) => item.callee.name === "validateOrder"))
  assert.ok(callees.some((item) => item.callee.name === "saveOrder"))

  const callers = getCallers(graph, "saveOrder")
  assert.ok(callers.some((item) => item.caller.name === "placeOrder"))

  const flow = traceFlow(graph, "placeOrder", 2)
  assert.equal(flow.start.name, "placeOrder")
  assert.ok(flow.paths.length >= 1)

  const pack = buildContextPack(graph, "placeOrder", "bug")
  assert.equal(pack.type, "bug")
  assert.equal(pack.traceStart.name, "placeOrder")
  assert.ok(pack.beginnerSummary.includes("Tipo de tarea"))
})

test("skips node_modules", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await mkdir(path.join(repo, "node_modules"))
  await writeFile(path.join(repo, "node_modules", "bad.js"), "function shouldNotAppear() {}")
  await writeFile(path.join(repo, "app.js"), "function shouldAppear() {}")

  const graph = await indexRepository(repo, { write: false })
  assert.ok(searchGraph(graph, "shouldAppear", 5).length > 0)
  assert.equal(searchGraph(graph, "shouldNotAppear", 5).length, 0)
})

test("skips calls inside strings and comments", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(
    path.join(repo, "app.js"),
    `function fakeCall() {
  return true
}

function explainFlow() {
  const text = "fakeCall() should not count"
  const template = ` + "`maybe fakeCall()`" + `
  // fakeCall()
  /* fakeCall() */
  return text + template
}
`,
  )

  const graph = await indexRepository(repo, { write: false })
  const callees = getCallees(graph, "explainFlow")
  assert.equal(callees.length, 0)
})

test("indexes Java classes and calls", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(
    path.join(repo, "InterestReportService.java"),
    `public class InterestReportService {
  public String buildAnnualReport(InterestCalculator calculator, InterestRequest request) {
    InterestResult result = calculator.calculateCompoundInterest(request);
    return formatReport(result);
  }

  private String formatReport(InterestResult result) {
    return String.valueOf(result.getTotalAmount());
  }
}
`,
  )

  const graph = await indexRepository(repo, { write: false })
  const found = searchGraph(graph, "InterestReportService.buildAnnualReport", 5)
  assert.ok(found.some((item) => item.node.name === "InterestReportService.buildAnnualReport"))

  const callees = getCallees(graph, "buildAnnualReport")
  assert.ok(callees.some((item) => item.callee.shortName === "formatReport"))
})

test("uses a method with real flow when building context for a class", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(
    path.join(repo, "ReportService.java"),
    `public class ReportService {
  public String buildReport() {
    return formatReport();
  }

  String formatReport() {
    return "ok";
  }
}
`,
  )

  const graph = await indexRepository(repo, { write: false })
  const pack = buildContextPack(graph, "ReportService", "bug")

  assert.equal(pack.traceStart.name, "ReportService.buildReport")
  assert.ok(pack.flowPaths.some((path) => path.some((node) => node.name === "ReportService.formatReport")))
})

test("detects Java package-private methods used in tests", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(
    path.join(repo, "ReportServiceTest.java"),
    `class ReportServiceTest {
  void buildsReport() {
    assertEquals("ok", subject.buildReport());
  }
}
`,
  )

  const graph = await indexRepository(repo, { write: false })
  const found = searchGraph(graph, "buildsReport", 5)

  assert.ok(found.some((item) => item.node.name === "ReportServiceTest.buildsReport"))
})

test("analyzeImpact finds all symbols that depend on a changed symbol", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(
    path.join(repo, "app.js"),
    `function base() { return 1 }
function mid() { return base() }
function top() { return mid() }
`,
  )

  const graph = await indexRepository(repo, { write: false })
  const result = analyzeImpact(graph, "base", 5)
  assert.equal(result.start.name, "base")
  assert.ok(result.impactedSymbols.some((node) => node.name === "mid"))
  assert.ok(result.impactedSymbols.some((node) => node.name === "top"))
})

test("analyzeImpact returns empty when symbol has no callers", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(path.join(repo, "app.js"), "function standalone() { return 42 }\n")

  const graph = await indexRepository(repo, { write: false })
  const result = analyzeImpact(graph, "standalone", 3)
  assert.equal(result.start.name, "standalone")
  assert.equal(result.impactedSymbols.length, 0)
  assert.equal(result.impactPaths.length, 0)
})

test("analyzeImpact returns empty start when symbol not found", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(path.join(repo, "app.js"), "function something() {}\n")

  const graph = await indexRepository(repo, { write: false })
  const result = analyzeImpact(graph, "nonExistentSymbol", 3)
  assert.equal(result.start, null)
  assert.equal(result.impactedSymbols.length, 0)
})

test("uninstall removes index, opencode config and opencode files", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(path.join(repo, "app.js"), "function start() { return done() }\nfunction done() { return true }\n")

  await initProject(repo, { source: "global" })

  const result = await uninstallProject(repo)
  assert.equal(result.ok, true)

  const config = JSON.parse(await readFile(path.join(repo, "opencode.json"), "utf8"))
  assert.equal(config.mcp?.["open-context-map"], undefined)

  const gitignore = await readFile(path.join(repo, ".gitignore"), "utf8")
  assert.ok(!gitignore.includes(".open-context-map/"))
})

test("init configures opencode and creates the initial index", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(path.join(repo, "app.js"), "function start() { return done() }\nfunction done() { return true }\n")

  const result = await initProject(repo, { source: "global" })
  assert.equal(result.ok, true)
  assert.equal(result.command.join(" "), "open-context-map mcp .")
  assert.equal(result.index, ".open-context-map/index.json")
  assert.match(result.nextStep, /Reinicia opencode/)

  const config = JSON.parse(await readFile(path.join(repo, "opencode.json"), "utf8"))
  assert.deepEqual(config.mcp["open-context-map"].command, ["open-context-map", "mcp", "."])
  assert.ok(config.watcher.ignore.includes(".open-context-map/**"))

  const skill = await readFile(path.join(repo, ".opencode/skills/open-context-map-first/SKILL.md"), "utf8")
  assert.ok(skill.includes("name: open-context-map-first"))
  assert.ok(skill.includes("el indice se actualiza solo"))

  const gitignore = await readFile(path.join(repo, ".gitignore"), "utf8")
  assert.ok(gitignore.includes(".open-context-map/"))
})

test("init uses pnpm by default", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(path.join(repo, "app.js"), "function start() { return true }\n")

  const result = await initProject(repo)
  assert.equal(result.ok, true)
  assert.deepEqual(result.command, ["pnpm", "dlx", "open-context-map@0.1.0", "mcp", "."])

  const config = JSON.parse(await readFile(path.join(repo, "opencode.json"), "utf8"))
  assert.deepEqual(config.mcp["open-context-map"].command, ["pnpm", "dlx", "open-context-map@0.1.0", "mcp", "."])
})

test("init rejects unexpected pnpm package specs", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(path.join(repo, "app.js"), "function start() { return true }\n")

  await assert.rejects(
    () => initProject(repo, { packageSpec: "evil-package" }),
    /open-context-map o open-context-map@version/,
  )
})

test("redacts secret-like snippets before storing them in the graph", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "open-context-map-test-"))
  await writeFile(
    path.join(repo, "app.js"),
    `function login(apiKey = "ghp_123456789012345678901234567890123456") {
  return send("Bearer github_pat_abcdefghijklmnopqrstuvwxyz")
}

function send(value) {
  return value
}
`,
  )

  const graph = await indexRepository(repo, { write: false })
  const login = searchGraph(graph, "login", 5).find((item) => item.node.name === "login")
  const callees = getCallees(graph, "login")
  const serialized = JSON.stringify(graph)

  assert.ok(login)
  assert.match(login.node.signature, /apiKey = "\[redacted\]"/)
  assert.ok(callees.some((item) => item.edge.detail.includes("Bearer [redacted]")))
  assert.ok(!serialized.includes("ghp_123456789012345678901234567890123456"))
  assert.ok(!serialized.includes("github_pat_abcdefghijklmnopqrstuvwxyz"))
})
