# Security for beginners

> Language: English
> Idioma: [Español](es/SECURITY_BEGINNER.md)

This document explains the security model in simple language.

It focuses on one question:

**What should you trust, and what should you verify, before using this tool?**

## What we checked before writing this guide

This guide was aligned with public documentation from:

- the official `opencode` MCP documentation
- npm documentation about common registry threats and mitigations
- GitHub documentation about repository security features

Those sources matter because this project lives at the intersection of three risky areas: package installation, AI tooling, and repository automation.

## Short version

`open-context-map` is designed to be a local tool.

- it reads repository files as text
- it does not execute the repository code it analyzes
- it stores its index locally in `.open-context-map/index.json`
- it blocks paths outside the selected repository root
- it tries to redact obvious secrets before saving snippets

That is a good starting point, but it does not remove all risk.

## What you still need to trust

There are three separate trust decisions.

### 1. The package you install

Use the exact package name and a pinned version:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Why this matters:

- pinning reduces surprise updates
- the exact package name helps avoid typosquatting mistakes
- the `init` command only accepts `@juliodiazru/open-context-map` or the same package with an explicit version

### 2. The repository you open in `opencode`

`opencode.json` and `.opencode/` are project configuration.

That means they must be treated as trusted code.

If you want to inspect an untrusted branch or PR first, disable project config:

```bash
OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode
```

### 3. The AI client you connect to

`open-context-map` keeps the index local.

However, an AI client may still send tool results to a model provider when you ask a question. That depends on the client and provider you use, not on the parser itself.

## Safe defaults in this project

### Runtime uses built-in Node.js APIs only

The current runtime path avoids external runtime dependencies.

That reduces supply chain surface for the actual tool execution.

Note: contributors still install development dependencies when working on this repository.

### The tool reads text, not code execution

It does not `import`, `require`, compile, or run the code it analyzes.

It only reads supported files as UTF-8 text.

### Supported file extensions are explicit

The scanner only reads selected source file types:

- JavaScript and TypeScript
- Python
- Go
- Java
- C#
- PHP
- Ruby
- Rust
- Kotlin
- Swift

Files outside that allowlist are skipped.

### Heavy and risky directories are skipped

Examples:

- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`
- `.next`
- `.cache`
- `target`

This lowers noise and also avoids scanning directories that are usually large or generated.

### Large files and huge repos are limited

Current defaults:

- files over `350000` bytes are skipped
- scanning stops after `5000` files

This helps avoid runaway work and oversized outputs.

### Paths outside the repo are blocked

The tool resolves paths inside the configured repository root and rejects paths that escape it.

That helps prevent accidental reads from another project or a sensitive system folder.

### Secret-like text is redacted before snippets are stored

Before saving signatures and call details in the local index, the parser redacts common patterns such as:

- `Bearer ...`
- `ghp_...`
- `github_pat_...`
- `AKIA...`
- assignments with names like `token`, `secret`, `password`, or `apiKey`

This is helpful, but it is not full secret scanning or full data loss prevention.

## What the tool stores locally

The main generated file is:

```text
.open-context-map/index.json
```

That file may contain:

- symbol names
- file paths
- short signatures
- caller and callee relationships
- redacted snippets

The file is meant to stay local and is added to `.gitignore` by `init`.

## Good habits for users

### Prefer pinned commands

Good:

```bash
pnpm dlx @juliodiazru/open-context-map@0.1.3 init .
```

Less safe:

```bash
pnpm dlx @juliodiazru/open-context-map init .
```

### Review generated configuration

After `init`, it is reasonable to inspect:

- `opencode.json`
- `.opencode/skills/open-context-map-first/SKILL.md`
- `.opencode/commands/bug-context.md`
- `.opencode/commands/explain-flow.md`
- `.opencode/agents/context-first.md`

### Be extra careful with untrusted pull requests

- use `pull_request` workflows for untrusted PRs
- avoid `pull_request_target` if the workflow checks out and runs PR code
- avoid broad `GITHUB_TOKEN` permissions without a real need

## Good habits for maintainers

Because the package is published, these hardening steps are worth keeping or strengthening over time:

- npm 2FA on maintainer accounts
- careful review of every new dependency
- trusted publishing and provenance when release automation is added
- CodeQL or similar code scanning
- Dependabot alerts and security updates
- branch protection and code owner review on sensitive files

## Review command for contributors

From this repository, run:

```bash
pnpm run check
```

That runs tests and a dependency audit.

## Sources used

- OpenCode MCP servers: https://opencode.ai/docs/mcp-servers/
- OpenCode config schema: https://opencode.ai/config.json
- OpenCode skills: https://opencode.ai/docs/skills/
- OpenCode commands: https://opencode.ai/docs/commands/
- OpenCode agents: https://opencode.ai/docs/agents/
- npm threats and mitigations: https://docs.npmjs.com/threats-and-mitigations
- npm registry signatures: https://docs.npmjs.com/about-registry-signatures
- npm audit documentation: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/
- npm provenance documentation: https://docs.npmjs.com/generating-provenance-statements
- GitHub security features overview: https://docs.github.com/en/code-security/getting-started/github-security-features
- GitHub supply chain security: https://github.blog/security/supply-chain-security/
