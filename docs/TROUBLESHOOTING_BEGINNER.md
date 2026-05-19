# Troubleshooting for beginners

> Language: English
> Idioma: [Español](es/TROUBLESHOOTING_BEGINNER.md)

Use this guide when `open-context-map` does not behave the way you expect.

## `opencode` does not see the tool

Check these items in order:

1. Run `init` from the project root.

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

2. Restart `opencode`.

`opencode` loads `opencode.json` and `.opencode/` when it starts.

3. Confirm that these files exist:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

4. If you are reviewing an untrusted branch, remember that `OPENCODE_DISABLE_PROJECT_CONFIG=1` disables project config on purpose.

## `open-context-map` command is not found

You may be using the published package without a global install.

That is normal.

You can still use the tool through:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

If you want direct CLI access after cloning this repository, run:

```bash
pnpm install
node src/cli.js --help
```

## Search returns nothing

Try this order:

1. Rebuild the index.

```bash
open-context-map index .
```

2. Search for a simpler name.

```bash
open-context-map search "initProject" .
```

3. Check whether the file extension is supported.

Supported extensions include JavaScript, TypeScript, Python, Go, Java, C#, PHP, Ruby, Rust, Kotlin, and Swift.

4. Check whether the file is too large.

Files over `350000` bytes are skipped.

## The repository is large and the results look incomplete

There are built-in limits.

- files bigger than `350000` bytes are skipped
- scanning stops after `5000` files
- generated directories such as `node_modules`, `dist`, `build`, and `coverage` are skipped

If your repository is very large, start with a smaller symbol and verify the result in real files.

## The graph seems wrong

The parser is heuristic.

That means some dynamic patterns may not resolve correctly.

Use this rule:

- trust the graph to find a starting point
- trust the real files for the final answer

## `opencode.json` or `opencode.jsonc` is invalid

`init` expects valid JSON or JSONC.

If the file already exists and has a syntax error, fix that file first and run `init` again.

Common causes:

- a missing comma
- an extra trailing character
- broken comments in JSONC

## You changed config but nothing happened

Restart `opencode`.

This matters after:

- `init`
- `uninstall`
- editing `opencode.json`
- editing files inside `.opencode/`

## You want to remove the setup

Run:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 uninstall .
```

That removes the generated MCP setup and local index.

## You are contributing to this repository

Run the full project check:

```bash
pnpm run check
```

That runs tests and a dependency audit.

## When to ask for help

If the problem is still unclear, collect these details first:

- the command you ran
- the exact error message
- whether you restarted `opencode`
- whether the target file type is supported
- whether the repository is unusually large
