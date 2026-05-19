# Beginner manual

> Language: English
> Idioma: [Español](es/MANUAL_BEGINNER.md)

This guide is for people who want to use `@juliodiazru/open-context-map` without reading the implementation first.

It uses simple language on purpose.

## First, know which path you need

There are two common ways to use this project.

### Path A: use the published tool inside another project

Choose this if you want to analyze a repository with `opencode`.

You do not need to clone this repository.

### Path B: contribute to this repository

Choose this if you want to change the code of `open-context-map` itself.

In that case you work in this repository and run:

```bash
pnpm install
```

That installs development dependencies for contributors. It is not the normal setup step for end users.

## What this tool is

It creates a local map of your code.

That map helps a person or an AI answer questions like these:

- where does this flow start
- who calls this function
- what does it call next
- what could break if I change it

## Important words

**Repository**: the folder where a project lives.

**Index**: the generated file that stores the map.

**Node**: one piece of the map, such as a file, class, function, or method.

**Relationship**: a connection between nodes. Example: one function calls another.

**Graph**: the full set of nodes and relationships.

**MCP**: a standard way for an AI tool to call external tools.

**opencode**: the AI tool that can load this MCP.

## Fastest path for most users

From the root of the project you want to analyze:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Then:

1. wait for the command to finish
2. restart `opencode`
3. ask for context in plain language

Example prompts:

- `use open-context-map to explain the flow of initProject`
- `use open-context-map to analyze the impact of changing UserService`
- `use open-context-map to build bug context for PaymentController`

## What `init` does

It creates the project files needed by `opencode`.

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`
- `.open-context-map/index.json`
- `.gitignore` entry for `.open-context-map/`

After that, you should not need to copy configuration files by hand.

## Step-by-step CLI use

You can also use the CLI directly.

### Step 1: go to the repository you want to analyze

```bash
cd your-project-name
```

### Step 2: create or refresh the map

```bash
open-context-map index .
```

The dot `.` means `use the current folder`.

This creates:

```text
.open-context-map/index.json
```

### Step 3: search for a symbol or file

```bash
open-context-map search "initProject" .
```

Use this when you want a starting point.

### Step 4: see who calls a symbol

```bash
open-context-map callers "initProject" .
```

Think of it as: `who uses this`.

### Step 5: see what a symbol calls next

```bash
open-context-map callees "initProject" .
```

Think of it as: `what does this trigger next`.

### Step 6: follow a flow forward

```bash
open-context-map trace "initProject" . --depth 3
```

Use this to follow the next few steps in the call chain.

### Step 7: estimate change impact

```bash
open-context-map impact "initProject" . --depth 3
```

Think of it as: `if I change this, what could I affect`.

### Step 8: build context for a task

For a bug:

```bash
open-context-map context "initProject" . --type bug
```

For a refactor:

```bash
open-context-map context "initProject" . --type refactor
```

For a feature:

```bash
open-context-map context "initProject" . --type feature
```

When you ask about a class, the tool tries to start from a useful method instead of stopping at the class name.

## Use it with `opencode`

1. Run `init` in the project.
2. Restart `opencode`.
3. Ask for context before editing code.

While the MCP is active, the index updates automatically when files change.

You do not need an external database.

## Useful helper files generated for `opencode`

`init` creates simple helper instructions:

- a skill that says `use the map first before editing`
- a `/bug-context` command
- an `/explain-flow` command
- a `context-first` subagent

## If something fails

Try these checks in order.

### 1. Rebuild the index

```bash
open-context-map index .
```

### 2. Try a simple search

```bash
open-context-map search "initProject" .
```

### 3. Restart `opencode`

This matters after `init`, `uninstall`, or manual changes to `opencode.json`.

### 4. Check whether the file type is supported

The parser currently reads these extensions:

- `.js`, `.mjs`, `.cjs`, `.jsx`
- `.ts`, `.tsx`
- `.py`, `.go`, `.java`, `.cs`, `.php`, `.rb`, `.rs`, `.kt`, `.swift`

### 5. Check whether the repository is too large for the current limits

- files bigger than `350000` bytes are skipped
- after `5000` files, scanning stops

### 6. If you are contributing to this repository, run the full check

```bash
pnpm run check
```

For more examples, read `docs/TROUBLESHOOTING_BEGINNER.md`.

## Remove the setup from a project

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 uninstall .
```

That removes the generated MCP entry, helper files, and local index.

## Important idea

`open-context-map` does not try to replace your editor's LSP.

Its job is different: build a simple repository map so you can decide what to read first and what a change might affect.
