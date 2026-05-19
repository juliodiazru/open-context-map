# Alignment with opencode

> Language: English
> Idioma: [Español](es/OPENCODE_ALIGNMENT.md)

This document explains why `open-context-map` is configured the way it is for `opencode`.

## What was reviewed

The setup was checked against public `opencode` references and nearby ecosystem examples, especially:

- the official `opencode` documentation
- the published `opencode` config schema
- public repositories that show the expected `.opencode/` file layout

The goal was simple: follow the official format instead of inventing a custom one.

## What `init` writes

`open-context-map init` creates an `opencode.json` entry for a local MCP server.

Example shape:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "open-context-map": {
      "type": "local",
      "command": ["pnpm", "dlx", "@juliodiazru/open-context-map@0.1.3", "mcp", "."],
      "enabled": true,
      "timeout": 15000
    }
  }
}
```

## Important alignment details

- `type` is `local`
- `command` is an array of strings
- `enabled` tells `opencode` to load the MCP
- `timeout` is expressed in milliseconds
- `watcher.ignore` is used to reduce index noise from generated directories
- skills live in `.opencode/skills/<name>/SKILL.md`
- commands live in `.opencode/commands/`
- agents live in `.opencode/agents/`

These details match the official structure described in the `opencode` docs.

## Why the generated instructions are short

The generated skill, commands, and subagent are intentionally small.

Their job is not to replace reasoning.

Their job is to remind the agent to do this in order:

1. use the map first
2. read the real files the map points to
3. only then make decisions or edits

That keeps the tool helpful without encouraging blind trust in the graph.

## Why restart is required

`opencode` loads project configuration when it starts.

So after `init`, `uninstall`, or manual changes to `opencode.json` or `.opencode/`, a restart is required.

This is normal for config-driven tooling.

## Security angle of the integration

The generated MCP setup stays local.

That matters because:

- no remote MCP URL is added by default
- no shell pipeline is required in the generated command
- the package name is pinned in the generated command

Even with that, `opencode.json` and `.opencode/` are still trusted project configuration and should be reviewed like code.

## What the user sees after `init`

After a successful setup:

- `opencode` can load the local MCP server
- the helper skill and commands become available
- the MCP server starts the native watcher
- the local index stays updated while the MCP is active

## Honest limit

`open-context-map` is not trying to replace the editor's LSP.

The LSP is still better for language diagnostics, autocomplete, and exact symbol navigation.

This project solves a different problem: give `opencode` a local repository map with callers, callees, flow, and impact.

The graph is a helper, not the final truth.
