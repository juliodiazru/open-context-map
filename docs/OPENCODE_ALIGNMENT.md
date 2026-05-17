# Alignment with opencode

This document explains why `open-context-map` follows the direction of `opencode` and public best practices from the ecosystem.

## What was reviewed

Known public repositories were reviewed to confirm the format:

- `anomalyco/opencode` on GitHub, especially its `README`, because it is the most visible public reference for the product
- `Kilo-Org/kilocode`, especially `packages/opencode/src/config/`, because that is where the schema that validates `mcp`, `watcher`, `commands`, and `agents` lives
- `Kilo-Org/kilocode/packages/opencode/test/skill/skill.test.ts`, to confirm how skills are loaded from `.opencode/skills/`
- `charmbracelet/crush`, as a nearby reference for the open skill and agent format

## How it stays aligned

`open-context-map init` creates an `opencode.json` with a local MCP.

That follows the official shape:

```json
{
  "mcp": {
    "open-context-map": {
      "type": "local",
      "command": ["pnpm", "dlx", "open-context-map@0.1.0", "mcp", "."],
      "enabled": true,
      "timeout": 15000
    }
  }
}
```

Important points:

- `type` is `local`
- `command` is a list of strings
- `enabled` turns the MCP on
- `timeout` avoids long waits
- `watcher.ignore` avoids index noise and heavy directories
- `.opencode/skills/`, `.opencode/commands/`, and `.opencode/agents/` use the paths that `opencode` already knows

## Best practices it respects

- a single `opencode.json` file per project
- a local MCP with a simple, portable command
- `skills`, `commands`, and `agents` files inside `.opencode/`
- short, focused instructions so the agent asks for context before editing
- installation and uninstallation with a single command
- automatic behavior after restarting `opencode`

## What it looks like in practice

`open-context-map init` leaves the project ready so the user does not need to copy files manually.

After that:

- `opencode` loads the local MCP
- `opencode` sees the skill, commands, and subagent
- the MCP server starts the native watcher
- incremental indexing keeps the map updated while you work

## Why this helps with the original problem

The original problem says that an LLM often reads linear text and loses the system's mental map.

This tool tries to reduce that problem by creating a simple graph before editing.

Instead of sending the whole repo to the agent, it provides:

- main symbols
- important files
- who calls what
- what gets called next
- likely flow
- related tests

## Honest limits

This tool does not compete with the editor's LSP.

The LSP is great for autocomplete, editor navigation, and language diagnostics.

`open-context-map` solves a different problem: give you a local repository map, with callers, callees, impact, and flow, without forcing you to install an external database or extra services.

The graph is a helper, not an absolute truth.

That is why the generated skill tells the agent to use the map first, but then read the real files before editing.

## Knowledge base

Known studies on code comprehension were also reviewed to avoid making unrealistic promises:

- Weiser, *Program Slicing* (IEEE TSE, 1984): supports looking backward at impact
- LaToza, Venolia, and DeLine (ICSE, 2006): supports following callers and callees to understand behavior
- Maalej et al. (TOSEM, 2014): supports the idea that people do not understand repositories by reading everything linearly
- RepoCoder (EMNLP, 2023): supports providing structured context instead of dumping full files into the model
