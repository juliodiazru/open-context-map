# GitHub security setup for beginners

> Language: English
> Idioma: [Español](es/GITHUB_SECURITY_SETUP_BEGINNER.md)

This guide explains which GitHub settings are worth enabling in addition to the files already stored in the repository.

## What is already versioned in this repo

These controls already exist in the repository itself:

- `CODEOWNERS` for sensitive paths such as `.github/`, `opencode.json`, and `.opencode/`
- a CI workflow with minimal permissions and SHA-pinned actions
- a `dependency-review` workflow
- `dependabot.yml`
- a pull request template with a security checklist

That is a strong start, but some important controls can only be enabled in GitHub's web UI.

## Recommended order

If you want a simple order, do this:

1. enable `Dependency graph`, `Dependabot alerts`, and `Dependabot security updates`
2. enable `CodeQL default setup`
3. enable secret scanning and push protection if your repo or plan supports them
4. protect `main`
5. review GitHub Actions policy settings

## Step 1: enable dependency visibility and automatic alerts

Open:

1. `Settings`
2. `Security and analysis`

Enable these features if they are available:

- `Dependency graph`
- `Dependabot alerts`
- `Dependabot security updates`

Why this matters:

- GitHub can tell you when a dependency is known to be vulnerable
- GitHub can open upgrade PRs automatically
- the dependency graph helps you understand what is in the repo

## Step 2: enable CodeQL default setup

For a project like this, GitHub's `default setup` is usually the easiest place to start.

Do this:

1. Open the repository on GitHub.
2. Open `Settings`.
3. Open `Security and analysis` or `Advanced Security`, depending on the current GitHub UI.
4. Find `CodeQL analysis`.
5. Click `Set up`.
6. Choose `Default`.
7. Confirm.

If the option does not appear, common causes are:

- the repository is private and your plan does not include GitHub Code Security
- GitHub Actions is disabled
- you do not have admin permissions
- the organization manages this setting above the repository level

For public repositories, CodeQL is often available without extra cost.

## Step 3: enable secret scanning and push protection when available

GitHub's security docs make a clear point: stopping secrets before they land in a repository is better than cleaning them up later.

In `Settings` -> `Security and analysis`, look for features such as:

- `Secret scanning`
- `Push protection`

Important notes:

- for public repositories, some secret protection features are available by default or for free
- for private repositories, availability can depend on your plan
- if your organization controls these settings, you may need an administrator

## Step 4: protect the `main` branch

If your GitHub plan supports `Rulesets`, use that. If not, classic branch protection is fine.

### Option A: Rulesets

1. Open `Settings`.
2. Open `Rules`.
3. Open `Rulesets`.
4. Create a `Branch ruleset`.
5. Target branch: `main`.

Recommended rules:

- require a pull request before merging
- require at least 1 approval
- require review from code owners
- require status checks to pass
- require conversation resolution before merging
- block force pushes
- block deletions

Useful optional rules:

- require signed commits
- require linear history

### Option B: Classic branch protection

1. Open `Settings`.
2. Open `Branches`.
3. Click `Add branch protection rule`.
4. Use `main` as the branch pattern.

Recommended settings:

- require a pull request before merging
- require approvals
- require review from code owners
- require status checks to pass before merging
- require conversation resolution before merging
- do not enable force pushes
- do not enable deletions

## Step 5: review GitHub Actions policy settings

Open `Settings` -> `Actions` -> `General`.

Check these items:

1. allow GitHub Actions and trusted creator actions only, if your policy allows it
2. require actions to be pinned to a full SHA, if that option is available
3. keep `GITHUB_TOKEN` permissions restricted by default
4. do not let GitHub Actions create or approve PRs unless there is a real need
5. avoid self-hosted runners for untrusted PRs
6. for public repos, require approval at least for first-time contributors from forks

If you do not see the same options, the most common reasons are:

- your organization controls them at a higher level
- you do not have admin permissions
- the GitHub UI moved the option
- the feature is plan-dependent

## How to verify the setup

After enabling the settings:

1. open a small PR
2. confirm checks such as `CI` and `Dependency Review` appear
3. if CodeQL is enabled, confirm its check appears too
4. change a file inside `.github/` or `.opencode/` in a test PR
5. confirm GitHub requests review from the owner listed in `CODEOWNERS`

## Minimal checklist if you want the shortest safe setup

If you do not want to enable many things at once, start with these:

1. `Dependabot alerts` and `Dependabot security updates`
2. `CodeQL default setup`
3. branch protection for `main`
4. secret scanning or push protection, if available

That already improves the repository's security posture a lot.
