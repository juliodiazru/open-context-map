# How it was built

This document explains the implementation in simple language.

## Step 1: project name and structure

The chosen published package name is `@juliodiazru/open-context-map`, while the CLI command remains `open-context-map`.

## Step 2: avoid external runtime dependencies

Node.js with built-in libraries was used.

The main reason was to reduce supply chain risk at this early stage.

## Step 3: create security controls

Main file: `src/security.js`

This is where the project defines:

- which directories to ignore
- which extensions to read
- maximum file size
- safe paths inside the repo
- the local index path

## Step 4: create a heuristic parser

Main file: `src/parser.js`

The parser uses regular expressions to detect:

- classes
- functions
- methods
- imports
- calls

It was also improved to ignore false calls inside strings and comments, because that was polluting the graph.

It also detects Java methods without `public`, `private`, or `protected`. This matters in JUnit tests, because many test methods are package-private.

## Step 5: create the indexer

Main file: `src/indexer.js`

The indexer:

1. walks source files
2. reads text safely
3. parses the content
4. creates nodes and relationships
5. stores `.open-context-map/index.json`

The index lives in local JSON on purpose.

That way there is no need to install an external database to start using the tool.

## Step 6: create graph queries

Main file: `src/graph.js`

This is where queries come from, such as:

- general search
- callers
- callees
- flows
- impact analysis
- context packs

When a person asks about a class, the context pack tries to start the flow from a real method with outgoing calls. That avoids getting stuck on the class name alone.

Impact analysis walks the graph backward: given a symbol, it finds all symbols that call it directly or indirectly. That answers the real senior-engineer question: "if I change this, what breaks".

## Step 7: create the CLI

Main file: `src/cli.js`

The CLI makes it possible to test everything without depending on `opencode` yet.

`open-context-map init` was also added, which prepares a user project automatically.

That command generates the `opencode` configuration, the `.opencode` files, the `.gitignore`, and the initial index.

`open-context-map uninstall` does the reverse: it cleans up everything that `init` added.

The idea is to keep a one-command flow for install and another one for uninstall.

## Step 8: keep the index updated

Main file: `src/watcher.js`

When MCP is active, a native watcher is used.

That watcher reindexes only the files that changed.

This lets the tool behave automatically while you work inside the repository.

## Step 9: create the MCP server

Main file: `src/mcp-server.js`

That file implements JSON-RPC over `stdio` so `opencode` can see the tools as a local MCP.

## Step 10: integrate with opencode

Relevant files:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

This was adjusted by following the official documentation for:

- config
- skills
- commands
- agents
- MCP servers

It was also compared against public ecosystem repositories to respect the most common `opencode` patterns.

Important validation from the official `opencode` documentation:

- `mcp` lives inside `opencode.json`
- a local MCP uses `type: "local"`
- `command` must be a list of strings
- `enabled` turns the MCP on or off
- `timeout` is expressed in milliseconds
- skills live in `.opencode/skills/<name>/SKILL.md`
- commands live in `.opencode/commands/`
- agents live in `.opencode/agents/`

The target installation format follows the official local MCP pattern:

```text
pnpm dlx @juliodiazru/open-context-map@0.1.2 init .
```

And inside `opencode.json` it leaves a local MCP with a command like:

```json
["pnpm", "dlx", "@juliodiazru/open-context-map@0.1.2", "mcp", "."]
```

## Step 11: keep honest limits

The parser is still heuristic.

That means it does not try to compete with a full LSP or with much heavier language-specific analyzers.

The goal here is different: provide a useful, fast, portable map that is easy to install.
