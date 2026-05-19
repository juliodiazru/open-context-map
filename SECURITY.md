# Security policy

> Language: English
> Idioma: [Español](SECURITY.es.md)

## Supported versions

This project is still early-stage.

Security fixes are expected to land on the current `main` branch first.

For packaged use, the latest published npm release is the supported release line.

## Reporting a vulnerability

If this project is hosted on GitHub, report vulnerabilities through a private GitHub security advisory.

Do not publish exploitation details before there is time to investigate and respond.

## Security design

- The runtime path uses built-in Node.js APIs only.
- The analyzed repository is read as UTF-8 text only.
- The tool does not execute, import, or require the analyzed repository code.
- Only allowed source extensions are scanned.
- Common generated or heavy directories are skipped.
- Symbolic links are skipped during repository walking.
- Files above the configured size limit are skipped.
- Repository scanning is capped by a maximum file count.
- Paths outside the configured repository root are rejected.
- Secret-like snippets are redacted before signatures and details are stored in the local index.
- Local indexes are stored in `.open-context-map/` and ignored by git.

## Current default limits

- allowed source extensions: `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.py`, `.go`, `.java`, `.cs`, `.php`, `.rb`, `.rs`, `.kt`, `.swift`
- skipped directories include `.git`, `node_modules`, `vendor`, `dist`, `build`, `.gradle`, `coverage`, `.next`, `.nuxt`, `.turbo`, `.cache`, `target`, and `__pycache__`
- maximum file size: `350000` bytes
- maximum scanned files: `5000`

## Known operational risks

- `opencode.json` and `.opencode/` are project configuration surfaces and must be treated as trusted code.
- To review an untrusted branch or PR in `opencode`, use `OPENCODE_DISABLE_PROJECT_CONFIG=1`.
- The local index stays on disk; treat it as generated local analysis data.
- AI clients may still send tool results to model providers depending on client configuration.
- In CI, avoid combining `pull_request_target` with checkout and execution of PR code.

## Repository hardening

- Workflows use `pull_request`, minimal permissions, and `persist-credentials: false`.
- Workflow actions are pinned by SHA to reduce the risk of unexpected upstream changes.
- There is a `dependency-review` workflow to detect vulnerable dependencies introduced in PRs.
- The repository includes `CODEOWNERS` for sensitive paths such as `.github/`, `opencode.json`, and `.opencode/`.
- CodeQL default setup is recommended when available.
- Dependabot alerts and security updates are recommended.
- Secret scanning and push protection are recommended when the repository and plan support them.
- There is a step-by-step guide in `docs/GITHUB_SECURITY_SETUP_BEGINNER.md` for applying those settings manually.
