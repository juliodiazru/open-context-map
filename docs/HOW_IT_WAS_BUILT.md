# How it was built

> Language: English
> Idioma: [Español](es/HOW_IT_WAS_BUILT.md)

This document is for contributors who want a simple explanation of the implementation.

If you are new to the project, read `README.md` and `docs/MANUAL_BEGINNER.md` first.

## Design goal

The project tries to stay useful without becoming heavy.

The main idea is:

```text
read source files as text
  -> detect symbols and relationships
  -> store a local JSON index
  -> answer context questions from CLI or MCP
```

## 1. Package and CLI naming

- published package: `@juliodiazru/open-context-map`
- CLI command: `open-context-map`

This keeps the npm package scoped while leaving the terminal command short.

## 2. Runtime dependency choice

The runtime path uses built-in Node.js APIs.

Reason:

- simpler install story
- smaller runtime supply chain surface
- easier review in an early-stage project

Development still uses normal dev tooling when contributors run `pnpm install`.

## 3. Security guardrails

Main file: `src/security.js`

This file defines the basic limits that keep the indexer predictable:

- which directories are skipped
- which file extensions are allowed
- maximum file size
- maximum file count
- path resolution inside the repo root
- local index location

The code also skips symbolic links and rejects paths outside the repository root.

## 4. Heuristic parsing

Main file: `src/parser.js`

The parser uses regular expressions and simple line-based analysis to detect:

- classes
- interfaces and similar type declarations
- functions and methods
- imports
- calls

It also strips comments and strings before call detection so obvious false positives are reduced.

The parser is intentionally lightweight. It is meant to give orientation, not to behave like a full compiler or language server.

## 5. Building the local index

Main file: `src/indexer.js`

The indexer does this work:

1. walk allowed source files
2. read each file safely
3. parse symbols and relationships
4. create graph nodes and edges
5. store `.open-context-map/index.json`

The index is local JSON on purpose.

That avoids requiring an external database just to try the tool.

## 6. Querying the graph

Main file: `src/graph.js`

This layer powers the main user questions:

- search
- callers
- callees
- trace
- impact
- context packs

Two design choices are especially important:

- context packs try to start from a useful method when the user asks about a class
- impact analysis walks backward through callers so the user can ask `what could break if I change this`

## 7. CLI commands

Main file: `src/cli.js`

The CLI exists for two reasons:

- people can test the engine without `opencode`
- the same engine can later be exposed through MCP

Important commands:

- `index`
- `watch`
- `search`
- `callers`
- `callees`
- `trace`
- `impact`
- `context`
- `init`
- `uninstall`
- `mcp`

## 8. Project setup generation

Main file: `src/init.js`

`init` writes the project files that `opencode` needs.

It creates:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`
- `.gitignore` entry for `.open-context-map/`
- the first local index

`uninstall` removes that generated setup again.

The goal is a one-command install and a one-command uninstall.

## 9. Keeping the index fresh

Main file: `src/watcher.js`

When the MCP server is active, a native watcher tracks file changes and reindexes only the changed files.

That keeps the map useful during normal work without asking the user to run extra sync commands.

## 10. MCP server

Main file: `src/mcp-server.js`

The server speaks JSON-RPC over `stdio` so `opencode` can start it as a local MCP server.

That gives the agent structured tools instead of forcing it to guess repository structure from raw text.

## 11. Why the generated files look the way they do

Relevant generated paths:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

These were shaped around the official `opencode` documentation for:

- config
- MCP servers
- skills
- commands
- agents

Important rules confirmed from the docs:

- `mcp` lives in `opencode.json`
- a local MCP uses `type: "local"`
- `command` is an array of strings
- `timeout` is in milliseconds
- skills live in `.opencode/skills/<name>/SKILL.md`
- commands live in `.opencode/commands/`
- agents live in `.opencode/agents/`

The generated command follows the official local MCP pattern:

```json
["pnpm", "dlx", "@juliodiazru/open-context-map@0.1.3", "mcp", "."]
```

## 12. Honest limits

This project does not try to compete with a full LSP or deep language-specific analyzers.

The goal is different:

- useful context quickly
- local install and uninstall
- portable JSON index
- enough structure to improve repository understanding before edits
