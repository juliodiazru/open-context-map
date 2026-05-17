import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { indexRepository, reindexFiles } from "../src/indexer.js"
import { searchGraph, getCallees, getCallers } from "../src/graph.js"
import { startWatcher } from "../src/watcher.js"

test("reindexFiles updates changed file nodes and edges", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "ocm-reindex-test-"))
  await writeFile(path.join(repo, "app.js"), "function alpha() { return beta() }\nfunction beta() { return 1 }\n")
  await indexRepository(repo)

  await writeFile(path.join(repo, "app.js"), "function alpha() { return gamma() }\nfunction gamma() { return 2 }\n")
  const graph = await reindexFiles(repo, [path.join(repo, "app.js")])

  const found = searchGraph(graph, "gamma", 5)
  assert.ok(found.some((item) => item.node.name === "gamma"))

  const oldSymbol = searchGraph(graph, "beta", 5)
  assert.equal(oldSymbol.length, 0)

  const callees = getCallees(graph, "alpha")
  assert.ok(callees.some((item) => item.callee.name === "gamma"))
  assert.equal(callees.filter((item) => item.callee.name === "beta").length, 0)
})

test("reindexFiles skips file when sha256 is unchanged", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "ocm-reindex-test-"))
  await writeFile(path.join(repo, "app.js"), "function stable() { return 1 }\n")
  const before = await indexRepository(repo)
  const beforeStats = { ...before.stats }

  const graph = await reindexFiles(repo, [path.join(repo, "app.js")])
  assert.deepEqual(graph.stats, beforeStats)
})

test("reindexFiles removes nodes for deleted file", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "ocm-reindex-test-"))
  await writeFile(path.join(repo, "keep.js"), "function keep() { return 1 }\n")
  await writeFile(path.join(repo, "remove.js"), "function toRemove() { return 2 }\n")
  await indexRepository(repo)

  await rm(path.join(repo, "remove.js"))
  const graph = await reindexFiles(repo, [path.join(repo, "remove.js")])

  assert.equal(searchGraph(graph, "toRemove", 5).length, 0)
  assert.ok(searchGraph(graph, "keep", 5).length > 0)
})

test("reindexFiles falls back to full index when no index exists", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "ocm-reindex-test-"))
  await writeFile(path.join(repo, "app.js"), "function hello() { return 1 }\n")

  const graph = await reindexFiles(repo, [path.join(repo, "app.js")])
  assert.equal(graph.stats.files, 1)
  assert.ok(searchGraph(graph, "hello", 5).length > 0)
})

test("reindexFiles handles multiple changed files", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "ocm-reindex-test-"))
  await writeFile(path.join(repo, "a.js"), "function aOld() { return 1 }\n")
  await writeFile(path.join(repo, "b.js"), "function bOld() { return 2 }\n")
  await indexRepository(repo)

  await writeFile(path.join(repo, "a.js"), "function aNew() { return 10 }\n")
  await writeFile(path.join(repo, "b.js"), "function bNew() { return 20 }\n")
  const graph = await reindexFiles(repo, [path.join(repo, "a.js"), path.join(repo, "b.js")])

  assert.ok(searchGraph(graph, "aNew", 5).length > 0)
  assert.ok(searchGraph(graph, "bNew", 5).length > 0)
  assert.equal(searchGraph(graph, "aOld", 5).length, 0)
  assert.equal(searchGraph(graph, "bOld", 5).length, 0)
})

test("startWatcher triggers reindex on file change", { timeout: 8000 }, async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "ocm-watcher-test-"))
  await writeFile(path.join(repo, "app.js"), "function original() { return 1 }\n")
  await indexRepository(repo)

  const watcher = await startWatcher(repo)

  try {
    await writeFile(path.join(repo, "app.js"), "function updated() { return 2 }\n")
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const { loadGraph } = await import("../src/graph.js")
    const graph = await loadGraph(repo)
    assert.ok(searchGraph(graph, "updated", 5).length > 0)
  } finally {
    watcher.stop()
  }
})

test("startWatcher stop() closes watchers cleanly", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "ocm-watcher-test-"))
  await writeFile(path.join(repo, "app.js"), "function x() {}\n")

  const watcher = await startWatcher(repo)
  assert.doesNotThrow(() => watcher.stop())
})
