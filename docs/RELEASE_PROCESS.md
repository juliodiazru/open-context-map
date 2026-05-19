# Release process

> Language: English
> Idioma: [Español](es/RELEASE_PROCESS.md)

This guide describes a practical release flow for this repository:

1. prepare the version in a branch
2. open and merge a pull request
3. create the Git tag
4. create the GitHub release
5. publish the package to npm with `pnpm`

It is written for the current repository state, where publishing is still a manual process.

## Official references used

- GitHub releases are built from tags and can be created from the web UI or `gh release create`
- GitHub recommends draft releases first when immutable releases are enabled
- npm requires `npm publish --access public` for scoped public packages
- `pnpm publish` supports `--access public`, `--dry-run`, `--otp`, and `--provenance`

Sources:

- https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
- https://docs.npmjs.com/creating-and-publishing-scoped-public-packages
- https://pnpm.io/cli/publish

## Before you start

Make sure all of these are true:

- you are working from an up-to-date branch based on `main`
- you can open a PR and create tags/releases in GitHub
- you can publish the package in npm
- `pnpm run check` passes locally
- you know the next semantic version you want to release

## Important repository-specific detail

This repository pins the current package version in more than one place.

At minimum, every release must keep these files aligned:

- `package.json`
- `src/init.js`
- `src/mcp-server.js`
- `src/cli.js`
- `test/indexer.test.js`
- documentation examples that mention the pinned package version

Today, `src/init.js` contains `PACKAGE_VERSION`, `src/mcp-server.js` exposes `serverInfo.version`, and `src/cli.js` includes the version in the help text. If you bump only `package.json`, the generated `opencode` setup and tests will drift.

## Recommended flow

## 1. Create a release branch

Example:

```bash
git switch -c release/v0.1.3
```

## 2. Update the version everywhere it is pinned

Update the target version consistently across:

- `package.json`
- `src/init.js`
- `src/mcp-server.js`
- `src/cli.js`
- `test/indexer.test.js`
- documentation examples that intentionally pin the install command

For this project, do not treat the docs as optional release metadata. They are part of the user-facing install path.

## 3. Run the verification steps

Run:

```bash
pnpm run check
pnpm test
```

Recommended extra checks:

```bash
pnpm pack --pack-destination /tmp/opencode-release-check
```

Then inspect what would be published.

This matters because npm recommends reviewing package contents for sensitive or unnecessary files before publishing.

## 4. Open the pull request

Open a PR that contains only the release preparation work.

The PR should include:

- the version bump
- synced docs examples
- any release-note-worthy user changes

Suggested PR title:

```text
release: v0.1.3
```

Before merging, confirm:

- CI is green
- `Dependency Review` is green
- the version is consistent in code and docs
- no secrets or temporary files are included

## 5. Merge the PR to `main`

Merge only after the checks pass.

After merging, pull the updated `main` locally.

## 6. Create the Git tag from `main`

Use an annotated tag:

```bash
git switch main
git pull --ff-only
git tag -a v0.1.3 -m "v0.1.3"
git push origin v0.1.3
```

Releases in GitHub are based on tags, so the tag should point at the exact commit you want to ship.

## 7. Create the GitHub release

You can do this in the GitHub web UI or with `gh`.

Example with `gh`:

```bash
gh release create v0.1.3 --title "v0.1.3" --generate-notes
```

If your repository later enables immutable releases, create the release as a draft first, attach everything you need, and then publish it.

Suggested release notes content:

- short summary of user-visible changes
- security-relevant changes, if any
- documentation changes, if they affect setup or trust model

## 8. Publish to npm with `pnpm`

Because this package is scoped and public, publish it with explicit public access.

From the repository root:

```bash
pnpm publish --access public
```

Useful variants:

```bash
pnpm publish --access public --dry-run
pnpm publish --access public --otp <code>
pnpm publish --access public --provenance
```

Notes:

- `--dry-run` is the safest first pass
- `--otp` is useful if npm requires 2FA and you want to avoid the prompt flow
- `--provenance` is useful when publishing from supported CI/CD systems

If you publish manually from your machine, provenance may not be available in the same way as a supported cloud CI publish.

## 9. Verify the published package

After publishing, check:

- the npm page for the new version
- the GitHub release page
- the tag list in GitHub

Practical verification commands:

```bash
npm view @juliodiazru/open-context-map version
npm view @juliodiazru/open-context-map dist-tags
pnpm dlx @juliodiazru/open-context-map@0.1.3 init . --no-index
```

The last command is a real smoke test for the user installation path.

## Minimal release checklist

- [ ] version updated in `package.json`
- [ ] version updated in `src/init.js`
- [ ] version updated in `src/mcp-server.js`
- [ ] version updated in `src/cli.js`
- [ ] version-sensitive tests updated
- [ ] docs examples updated where needed
- [ ] `pnpm run check` passed
- [ ] PR merged to `main`
- [ ] tag pushed
- [ ] GitHub release created
- [ ] `pnpm publish --access public` completed
- [ ] npm package page and install smoke test verified

## Suggested future improvement

This repo would benefit from documenting or automating one of these next:

1. a `scripts/release-check.mjs` script that validates every pinned version location
2. a release checklist in PR templates or issue templates
3. trusted publishing from GitHub Actions with provenance
