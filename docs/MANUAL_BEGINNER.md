# Beginner manual

This manual explains the project step by step, without assuming advanced experience.

## What open-context-map is

It is a tool that creates a map of your code.

That map helps an AI or a person understand the project better before changing files.

## Important words

**Repository**: the folder where a project lives.

**Index**: the file that stores the processed map.

**Node**: one piece of the map. It can be a file, a class, or a function.

**Relationship**: a connection between nodes. For example: one function calls another.

**Graph**: the full set of nodes and relationships.

**MCP**: the standard way for an AI to use external tools.

**opencode**: the tool where an agent can use this MCP.

## Step 1: enter the project folder

```bash
cd your-project-name
```

## Step 2: install

```bash
pnpm install
```

Because the project has no external runtime dependencies, this should be fast.

## Install open-context-map in another project

The intended user flow is a single command:

```bash
pnpm dlx open-context-map@0.1.0 init .
```

That command creates the `opencode` configuration, the skill, the commands, the agent, and the initial index.

The idea is that afterward you should not need extra manual steps: restart `opencode` and the tool is ready.

## Uninstall open-context-map from a project

```bash
pnpm dlx open-context-map@0.1.0 uninstall .
```

That command cleans up everything `init` added:

- the `.open-context-map/` directory
- the MCP entry in `opencode.json`
- the generated `.opencode/` files
- the `.gitignore` entry

## Step 3: create or update the map

```bash
open-context-map index .
```

The dot `.` means: `use this current folder`.

That command creates:

```text
.open-context-map/index.json
```

## Step 4: search for something

```bash
open-context-map search "indexRepository"
```

This is useful for finding a class, a function, or a file related to that text.

## Step 5: see who calls a function

```bash
open-context-map callers "indexRepository"
```

Think of it as: `who uses this`.

## Step 6: see what a function calls

```bash
open-context-map callees "indexRepository"
```

Think of it as: `what does this do next`.

## Step 7: follow a flow forward

```bash
open-context-map trace "indexRepository" --depth 3
```

This tries to follow the call chain several steps forward.

## Step 8: analyze the impact of changing a symbol

```bash
open-context-map impact "indexRepository" --depth 3
```

Think of it as: `if I change this, what breaks`.

The result shows all symbols that call `indexRepository` directly or indirectly.

## Step 9: build context for a task

For a bug:

```bash
open-context-map context "indexRepository" --type bug
```

For a refactor:

```bash
open-context-map context "indexRepository" --type refactor
```

For a feature:

```bash
open-context-map context "indexRepository" --type feature
```

When you ask about a class, the tool tries to find the most useful method to start the flow.

## Step 10: use it with opencode

1. Install it in your project with `init`.
2. Open or restart `opencode` in that project.
3. Ask for something like: `use open-context-map to explain the flow of indexRepository`.

While MCP is active, the index updates automatically when files change. You do not need to run another tool or an external database.

## Useful opencode commands included in the project

The engine includes real configuration examples:

- skill: use the map first before editing
- command `/bug-context`
- command `/explain-flow`
- subagent `context-first`

In a user project, those files are not copied manually: `open-context-map init` generates them.

## If something fails

1. Rebuild the index.

```bash
open-context-map index .
```

2. Try a simple search.

```bash
open-context-map search "indexRepository"
```

3. Run the tests.

```bash
pnpm test
```

4. If you changed `opencode.json`, close and reopen `opencode`.

## Important idea

`open-context-map` does not try to replace your editor's LSP.

Its job is different: give you a simple repository map so you can understand where a flow comes from, what a change impacts, and which pieces are worth reading first.
