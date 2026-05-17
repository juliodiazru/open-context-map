# Security policy

## Supported versions

This project is still in an early stage.

Only the current `main` branch is considered supported.

## Reporting a vulnerability

If this project is hosted on GitHub, open a private security advisory.

Do not publish exploitation details before there is time to respond.

## Security design

- No external runtime dependencies in this POC.
- The analyzed repository is read as text only.
- The tool does not execute the analyzed code.
- Large files and common dependency or build directories are skipped.
- Signatures and details stored in the local index are redacted when they look like common secrets.
- Local indexes are ignored by git.

## Known operational risks

- `opencode.json` and `.opencode/` are project configuration surfaces. Treat them as trusted code.
- To review untrusted branches or PRs in `opencode`, use `OPENCODE_DISABLE_PROJECT_CONFIG=1`.
- In CI, avoid combining `pull_request_target` with checkout and execution of PR code.

## Repository hardening

- Workflows use `pull_request`, minimal permissions, and `persist-credentials: false`.
- Workflow actions are pinned by SHA to reduce the risk of unexpected upstream changes.
- There is a `dependency-review` workflow to detect vulnerable dependencies introduced in PRs.
- The repository includes `CODEOWNERS` for sensitive paths such as `.github/`, `opencode.json`, and `.opencode/`.
- CodeQL is still recommended, but GitHub recommends enabling it from the repository's default setup in Settings.
- There is a step-by-step guide in `docs/GITHUB_SECURITY_SETUP_BEGINNER.md` for applying those settings manually.
