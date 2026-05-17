# GitHub security setup for beginners

This guide explains what you should enable manually in GitHub to complement what is already saved in the repository.

## What is already inside the repo

These controls are already versioned:

- `CODEOWNERS` for `.github/`, `opencode.json`, and `.opencode/`
- a CI workflow with minimal permissions and SHA-pinned actions
- a `dependency-review` workflow
- `dependabot.yml`
- a pull request template with a security checklist

That helps a lot, but some settings can only be enabled from GitHub's web interface.

## Step 1: enable CodeQL default setup

For a project like this, GitHub recommends starting with `default setup`.

Do this:

1. Open the repository on GitHub.
2. Open `Settings`.
3. In the sidebar, open `Advanced Security`.
4. In the `Code Security` section, find `CodeQL analysis`.
5. Click `Set up`.
6. Choose `Default`.
7. Confirm with `Enable CodeQL`.

If it does not appear, it is usually for one of these reasons:

- the repo is `private` and does not have `GitHub Code Security` enabled
- `GitHub Actions` is disabled in that repo
- you do not have admin permissions on the repository
- you are on a fork with Actions disabled

For public repositories, `CodeQL` should usually be available without extra payment.

What you gain from this:

- GitHub analyzes insecure code patterns.
- You do not have to maintain a complex workflow by hand.
- It is the simplest option to start with.

## Step 2: enable Dependabot alerts and security updates

Do this:

1. In `Settings`.
2. Go to `Security and analysis`.
3. Enable:
   - `Dependency graph` if it is not already active
   - `Dependabot alerts`
   - `Dependabot security updates`

What you gain from this:

- GitHub warns you if a known dependency becomes vulnerable.
- GitHub can open security PRs automatically.

## Step 3: protect the `main` branch

If your plan allows it, use `Rulesets`. If not, use classic `Branch protection`. Both options work.

### Option A: Rulesets

1. `Settings`.
2. `Rules`.
3. `Rulesets`.
4. `New ruleset`.
5. Type: `Branch ruleset`.
6. Target branch: `main`.

Enable these rules:

- `Require a pull request before merging`
- `Require approvals`: at least 1
- `Require review from Code Owners`
- `Require status checks to pass`
- select checks such as:
  - `test`
  - `dependency-review`
- `Require conversation resolution before merging`
- `Block force pushes`
- `Block deletions`

If you want more control:

- `Require signed commits`
- `Require linear history`

### Option B: Classic branch protection

1. `Settings`.
2. `Branches`.
3. `Add branch protection rule`.
4. Branch name pattern: `main`.

Check:

- `Require a pull request before merging`
- `Require approvals`
- `Require review from Code Owners`
- `Require status checks to pass before merging`
- `Require conversation resolution before merging`
- do not enable `Allow force pushes`
- do not enable `Allow deletions`

Important:

- in classic branch protection, blocking force pushes and deletions is already the default behavior
- you only need to make sure you do not enable those two options
- if `Branches` or `Add branch protection rule` does not appear, it usually means you are missing admin permissions or the organization enforces `Rulesets`

## Step 4: review GitHub Actions settings

In `Settings` -> `Actions` -> `General`, review this:

1. Allow GitHub actions and verified creator actions.
2. If GitHub allows it, enable the policy that requires actions to be pinned to a full SHA.
3. Disable the ability for GitHub Actions to create or approve pull requests automatically unless you truly need it.
4. Do not use self-hosted runners for untrusted PRs.

If you do not see those exact options:

- an organization or enterprise policy may be controlling them above the repository level
- the option to allow only GitHub and verified creator actions appears inside `Actions permissions`
- the full-SHA requirement may not appear in every repository or may depend on an upper-level policy
- `Allow GitHub Actions to create and approve pull requests` may already be disabled by default, especially in personal repositories

Also review this on the same screen:

1. `Workflow permissions`: leave `GITHUB_TOKEN` in restricted or read-only mode by default if GitHub gives you that option.
2. `Approval for running fork pull request workflows from contributors`: for public repos, requiring approval at least for `first-time contributors` is reasonable.

## If an option does not appear

Before assuming GitHub hid it, check these common causes:

1. You do not have `admin` permissions on the repo.
2. The repo belongs to an organization and the policy is controlled above it.
3. The repo is `private` and the feature requires `GitHub Code Security`.
4. `GitHub Actions` is disabled.
5. You are looking at a newer UI where GitHub moved the option elsewhere.

The practical rule is:

- if you cannot change it in the repo, you probably need to ask whoever administers the organization
- if the repo is public, many security options should already be available

## Step 5: how to verify everything is working

After enabling everything:

1. Open a small PR.
2. Verify that checks appear, such as:
   - `CI / test`
   - `Dependency Review / dependency-review`
   - CodeQL, if it is already active
3. Change a file inside `.github/` or `.opencode/` in a test PR.
4. Confirm that GitHub requests review from the owner defined in `CODEOWNERS`.

## Simple recommendation

If you do not want to overcomplicate it, start with only this:

1. `CodeQL default setup`
2. `Dependabot alerts`
3. protect `main` with mandatory PRs, 1 approval, code owners, and status checks

That already raises the security level a lot without making the project heavy.
