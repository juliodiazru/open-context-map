# Security for beginners

This project was built with security as a priority.

## Why it matters

Supply chain attacks have happened in the JavaScript ecosystem.

That means a problem in packages, install scripts, tokens, or CI can end up affecting your project.

## Security decisions in this POC

### No external runtime dependencies

The main engine uses only built-in Node.js APIs.

That does not remove all risk, but it greatly reduces the initial attack surface.

### Simple but reviewable installation

The target install flow is:

```bash
pnpm dlx open-context-map@0.1.0 init .
```

That follows the official `opencode` pattern for local MCPs with `pnpm dlx` commands, but pinning the version and reviewing the package before adopting it is still recommended.

To lower risk, `init` only accepts the official `open-context-map` package or a pinned version of that same package.

### It does not execute code from the analyzed repo

The engine only reads files as text.

It does not `import` or `require` the code it analyzes.

### It ignores heavy or risky directories

By default it does not analyze directories such as:

- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`
- `.cache`
- `target`

### It limits large files

If a file is larger than the allowed size, it is skipped.

### It blocks paths outside the repo

The MCP should not accept arbitrary paths outside the configured root.

This helps avoid reading another project or a sensitive folder by accident.

### It limits user input

The `trace` command limits maximum depth.

Search limits the maximum number of results.

The context type only accepts known values: `bug`, `refactor`, `feature`, and `general`.

This helps avoid huge responses and unnecessary memory usage.

### Separate local index

The result is stored in:

```text
.open-context-map/index.json
```

That file is ignored by git.

The reason is simple: this workflow does not need an external database.

Fewer external moving parts also means less operational surface and fewer install or uninstall steps.

### Basic secret redaction

Before storing signatures and call details in the local index, the engine tries to hide common patterns such as `Bearer ...`, `ghp_...`, `github_pat_...`, `AKIA...`, and assignments with names like `token`, `secret`, `password`, or `apiKey`.

It is not full DLP, but it helps avoid repeating obvious secrets inside the index and also reduces noise in MCP responses.

### How to review untrusted branches or PRs

There is an important point: `opencode.json` and `.opencode/` are configuration that a project can bring with it.

If you are about to open a branch or PR you do not trust yet, review it with project configuration disabled:

```bash
OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode
```

That lowers the risk that repository configuration executes something you have not reviewed yet.

## Review commands

Run:

```bash
pnpm run check
```

That runs tests and a basic audit.

## If it is ever published to the package registry

It would be worth adding or strengthening:

- 2FA
- trusted publishing with OIDC
- provenance
- review of every new dependency
- CodeQL or Semgrep
- Dependabot or Renovate
- OpenSSF Scorecard

## CI and pull requests

- Use `pull_request` to test untrusted PRs.
- Avoid `pull_request_target` if you will check out and execute PR code.
- Keep minimal permissions in GitHub Actions and avoid storing tokens in steps that do not need them.

## Sources used

- OpenCode MCP servers: https://opencode.ai/docs/mcp-servers/
- OpenCode config schema: https://opencode.ai/config.json
- OpenCode skills: https://opencode.ai/docs/skills/
- OpenCode commands: https://opencode.ai/docs/commands/
- OpenCode agents: https://opencode.ai/docs/agents/
- Node.js security releases: https://nodejs.org/en/blog/vulnerability/
- Registry threats and mitigations: https://docs.npmjs.com/threats-and-mitigations
- Registry signatures: https://docs.npmjs.com/about-registry-signatures
- Audit docs: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/
- Provenance docs: https://docs.npmjs.com/generating-provenance-statements
- GitHub supply chain security: https://github.blog/security/supply-chain-security/
- SLSA: https://slsa.dev/spec/v1.0/
- OpenSSF Scorecard: https://github.com/ossf/scorecard
