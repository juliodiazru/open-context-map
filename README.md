# @juliodiazru/open-context-map

> Language: English
> Idioma: [Español](README.es.md)

`@juliodiazru/open-context-map` builds a local map of your repository and exposes it as an MCP server for `opencode`.

In simple terms:

- it reads your project as text
- it finds files, classes, functions, methods, imports, and calls
- it stores those relationships in a local index
- `opencode` can ask for that context before editing code

This project follows a simple rule: give useful structure first, then read the real files.

Useful docs:

- `docs/README.md`
- `docs/MANUAL_BEGINNER.md`
- `docs/TROUBLESHOOTING_BEGINNER.md`
- `docs/SECURITY_BEGINNER.md`
- `docs/GITHUB_SECURITY_SETUP_BEGINNER.md`
- `docs/RELEASE_PROCESS.md`

## Why this exists

When you want to fix a bug or change a feature, one file is rarely enough.

You usually need to answer questions like these:

- where does this flow start
- who calls this function
- what does it call next
- what could break if I change it

`open-context-map` tries to answer those questions quickly with a local graph.

## Quick start

This is the easiest path if you already use `opencode`.

### 1. Check requirements

- Node.js `20` or newer
- `pnpm`
- `opencode` if you want the MCP integration

### 2. Run the pinned install command

From the root of the project you want to analyze:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Keeping the version pinned is safer than running an unpinned package name.

### 3. Restart `opencode`

`opencode` reads `opencode.json` and `.opencode/` when it starts. Close it and open it again after `init` finishes.

### 4. Ask for context

Examples:

- `use open-context-map to explain the flow of initProject`
- `use open-context-map to analyze the impact of changing indexRepository`
- `use open-context-map to build bug context for UserService`

## What `init` creates

The `init` command prepares your project so you do not need to copy files by hand.

- `opencode.json` with a local MCP named `open-context-map`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`
- `.gitignore` with `.open-context-map/`
- `.open-context-map/index.json`

## How it works in one glance

```text
your repository
  -> open-context-map reads source files as text
  -> builds .open-context-map/index.json
  -> opencode calls the MCP
  -> the agent gets callers, callees, flow, and impact before editing
```

## First CLI examples

Create or refresh the local index:

```bash
open-context-map index .
```

Expected output looks like this:

```json
{
  "ok": true,
  "message": "Index created",
  "stats": {
    "files": 12,
    "nodes": 176,
    "edges": 530
  }
}
```

Search for a symbol:

```bash
open-context-map search "initProject" .
```

Example output:

```json
[
  {
    "score": 90,
    "node": {
      "name": "initProject",
      "file": "src/init.js",
      "line": 12,
      "kind": "function"
    }
  }
]
```

If the index does not exist yet, query commands create it automatically.

## Common tasks

| I want to... | Command |
| --- | --- |
| build or refresh the map | `open-context-map index .` |
| watch local changes manually | `open-context-map watch .` |
| search for a symbol or file | `open-context-map search "initProject" .` |
| see who uses a symbol | `open-context-map callers "initProject" .` |
| see what a symbol uses next | `open-context-map callees "initProject" .` |
| follow the flow forward | `open-context-map trace "initProject" . --depth 3` |
| estimate what a change could affect | `open-context-map impact "initProject" . --depth 3` |
| build a context pack for an AI task | `open-context-map context "initProject" . --type feature` |
| run the local MCP server directly | `open-context-map mcp .` |
| remove generated files from a project | `open-context-map uninstall .` |

Available context types:

- `bug`
- `refactor`
- `feature`
- `general`

## Automatic indexing

You do not need a separate database or background service.

- `init` leaves the project ready
- the MCP server starts a native watcher
- only changed files are reindexed
- the index stays local in `.open-context-map/index.json`

## Supported source files

The current parser reads these extensions:

- `.js`, `.mjs`, `.cjs`, `.jsx`
- `.ts`, `.tsx`
- `.py`
- `.go`
- `.java`
- `.cs`
- `.php`
- `.rb`
- `.rs`
- `.kt`
- `.swift`

## Honest limits

This tool is useful, but it is not magic.

- it is not a replacement for your editor's LSP
- the parser is heuristic, so dynamic language tricks may be missed
- it reads text only and does not execute repository code
- it skips large files over `350000` bytes
- it stops after `5000` files by default
- it skips heavy directories such as `node_modules`, `.git`, `dist`, `build`, `coverage`, `.next`, `.cache`, and `target`

The graph is a helper. The source files are still the final truth.

## Security summary

This README only gives the short version. Read `docs/SECURITY_BEGINNER.md` and `SECURITY.md` for more detail.

- the runtime uses built-in Node.js APIs only
- the tool does not execute the code it analyzes
- paths outside the selected repository are blocked
- secret-like text is redacted before snippets are stored in the local index
- the MCP setup follows the official local server format from the `opencode` docs
- `opencode.json` and `.opencode/` are project configuration, so treat them as trusted code

If you are reviewing an untrusted branch or PR, start `opencode` like this:

```bash
OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode
```

## Uninstall

To remove the generated project setup:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 uninstall .
```

That removes the generated MCP entry, helper files, and the local index directory.

## Documentation map

- `docs/MANUAL_BEGINNER.md`: first-time tutorial in simple language
- `docs/TROUBLESHOOTING_BEGINNER.md`: common problems and quick fixes
- `docs/SECURITY_BEGINNER.md`: beginner-friendly security explanation
- `docs/GITHUB_SECURITY_SETUP_BEGINNER.md`: GitHub hardening checklist
- `docs/RELEASE_PROCESS.md`: maintainer release flow for PR, tag, release, and npm publish
- `docs/HOW_IT_WAS_BUILT.md`: contributor-friendly implementation overview
- `docs/OPENCODE_ALIGNMENT.md`: why the generated setup matches `opencode`
- `docs/PLAN.md`: current roadmap and next steps
- `SECURITY.md`: formal security policy and trust model

## Verification

If you are contributing to this repository, run:

```bash
pnpm run check
```

That runs:

- `pnpm test`
- `pnpm audit --audit-level moderate`

## Project status

The current release validates this workflow:

1. build a local code map
2. query it from the CLI
3. expose it through MCP
4. use it from `opencode` before editing code
5. analyze change impact before editing

The idea is informed by well-known work on program comprehension and code change, including Weiser on program slicing, LaToza/Venolia/DeLine on developer mental models, Maalej et al. on structural navigation, and RepoCoder on structured retrieval for code tasks.
