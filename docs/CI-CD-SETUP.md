# CI/CD Setup Guide

This document explains the complete CI/CD pipeline for huntr-cli, including pre-commit hooks, GitHub Actions workflows, and best practices.

## Table of Contents

1. [Local Development Hooks](#local-development-hooks)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Publishing to npm](#publishing-to-npm)
4. [Setting Up Secrets](#setting-up-secrets)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Hooks

### Setup (First Time)

When you clone the repo or first install dependencies, hooks are automatically set up:

```bash
npm install
# npm's "prepare" script automatically runs husky install
```

Or manually initialize:

```bash
npm run prepare
```

### Pre-commit Hook

**What it does:** Runs linting on only the files you're committing (via `lint-staged`)

**When it runs:** Before `git commit`

**Files checked:**
- All staged TypeScript files in `src/`

**What happens on failure:**
- ❌ Commit is blocked
- ESLint errors are shown
- You must fix errors and re-stage files

**Example:**

```bash
$ git add src/cli.ts
$ git commit -m "feat: add new feature"

🔍 Running pre-commit checks...
  ✓ src/cli.ts (eslint --fix)
✓ Pre-commit checks passed

[main abc1234] feat: add new feature
 1 file changed, 10 insertions(+)
```

**Manual linting:**

```bash
npm run lint          # Check all files
npm run lint:fix      # Auto-fix errors
```

### Pre-push Hook

**What it does:** Comprehensive checks before pushing to remote

**When it runs:** Before `git push` (blocks if checks fail)

**Checks performed (in order):**
1. TypeScript compilation (`npm run typecheck`)
2. Linting all source files (`npm run lint`)
3. Build to `dist/` (`npm run build`)

**What happens on failure:**
- ❌ Push is blocked
- Error details shown
- You must fix the issue before retrying push

**Example:**

```bash
$ git push origin feature/new-feature

🧪 Running pre-push checks...
📋 Typechecking...
✓ No TypeScript errors
🔍 Linting all source files...
✓ Lint passed
🔨 Building...
✓ Build successful
✓ All pre-push checks passed

Counting objects: 3, done.
Writing objects: 100% (3/3), 287 bytes | 287.00 KiB/s, done.
```

### Bypassing Hooks (Not Recommended)

**⚠️ Use only in emergencies:**

```bash
# Skip pre-commit hook only
git commit --no-verify

# Skip pre-push hook only
git push --no-verify
```

**Better approach:** Fix the issue instead of bypassing!

---

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` or `develop`.

**Jobs (run in parallel):**

1. **Lint** (ubuntu-latest)
   - Installs Node 18
   - Runs `npm run lint`
   - Fails if lint errors found

2. **Typecheck** (ubuntu-latest)
   - Installs Node 18
   - Runs `npm run typecheck`
   - Fails if TypeScript errors found

3. **Build** (ubuntu-latest)
   - Installs Node 18
   - Runs `npm run build`
   - Uploads `dist/` artifacts (1 day retention)

4. **Test** (ubuntu-latest)
   - Installs Node 18
   - Runs `npm test`

**When it fails:**
- PR shows red ❌ check
- Cannot merge PR until all jobs pass
- See logs at: `Actions` tab → workflow run

**View logs:**
1. Go to GitHub repo
2. Click `Actions` tab
3. Click the workflow run
4. Click the failed job
5. Click the failed step for details

### Publish Workflow (`.github/workflows/publish.yml`)

Automatically publishes to npm when a GitHub Release is created.

**Trigger:** Release published (created from existing tag)

**Steps:**
1. Checkout code
2. Setup Node 18
3. Install dependencies
4. Run linting
5. Typecheck
6. Build
7. **Publish to npm** using `NPM_TOKEN` secret
8. Comment on release with success/failure

**How to trigger:**

```bash
# 1. Create and push git tag
git tag v1.1.0
git push origin v1.1.0

# 2. Create release in GitHub UI or CLI
gh release create v1.1.0 --title "Version 1.1.0" --generate-notes

# OR use GitHub web UI:
# Go to Releases → Create new release → select tag → Publish release
```

**Requirements:**
- `NPM_TOKEN` secret configured (see [Setting Up Secrets](#setting-up-secrets))
- Version in `package.json` must match tag (or set manually)

### Manual Publish Workflow (`.github/workflows/manual-publish.yml`)

On-demand publishing without requiring a GitHub Release.

**Trigger:** Manual via GitHub UI (`Actions` → `Manual Publish` → `Run workflow`)

**Input:**
- `version` — Version to publish (e.g., `1.1.0`, `1.1.0-beta.1`)
- `npm_tag` — npm tag (`latest`, `beta`, `next`, `rc`)

**Steps:**
1. Validate version format
2. Update `package.json`
3. Lint → Typecheck → Build
4. Publish to npm with specified tag
5. Create git tag
6. Create GitHub Release
7. (Optional) Send Slack notification

**How to use:**

1. Go to GitHub repo → `Actions` tab
2. Click `Manual Publish` workflow
3. Click `Run workflow`
4. Fill in version (e.g., `1.1.0-beta.1`)
5. Select npm tag (`beta` for prereleases)
6. Click `Run workflow`

**Requirements:**
- `NPM_TOKEN` secret
- `SLACK_WEBHOOK_URL` secret (optional, for notifications)

### Security Audit Workflow (`.github/workflows/security-audit.yml`)

Audits dependencies for vulnerabilities daily and on-demand.

**Triggers:**
- Daily at midnight UTC
- Every push to main/develop
- Manual via `Actions` tab

**Steps:**
1. Install dependencies
2. Run `npm audit` (moderate severity or higher)
3. Upload audit report as artifact

**View audit reports:**
1. Go to `Actions` → `Security Audit`
2. Click the latest run
3. Download artifacts

**Audit severity levels:**
- `low` — Minor issues
- `moderate` — Consider updating
- `high` — Should update soon
- `critical` — Update immediately

---

## Publishing to npm

### Method 1: Automatic (GitHub Release)

Best for releases from GitHub:

```bash
# 1. Update version in package.json
npm version minor  # 1.0.0 → 1.1.0

# 2. Push to GitHub
git push origin main --tags

# 3. Create release in GitHub UI or CLI
gh release create v1.1.0 --generate-notes

# The publish.yml workflow automatically publishes to npm
```

**Advantages:**
- Automatic
- Release notes auto-generated
- GitHub Release created automatically
- Professional workflow

### Method 2: Manual Dispatch

For pre-releases or emergencies:

1. Go to GitHub repo
2. `Actions` tab
3. `Manual Publish` workflow
4. `Run workflow`
5. Enter version and npm tag
6. Click `Run`

**Use cases:**
- Publishing betas/RCs
- Fixing version issues
- Publishing without Git flow

### Method 3: Local (Manual)

For testing only, not recommended for production:

```bash
# 1. Ensure everything is committed
git status

# 2. Update version
npm version minor

# 3. Build & publish
npm publish

# 4. Create git tag & push
git tag v1.1.0
git push origin main --tags
```

**⚠️ Not recommended:** No automated checks, easy to forget steps

---

## Setting Up Secrets

### NPM Token

Required for automated publishing:

1. Go to npmjs.com
2. Profile → `Access Tokens`
3. Generate new token (Automation level)
4. Copy token (long string starting with `npm_`)
5. GitHub repo → Settings → Secrets and variables → Actions
6. Create new secret: `NPM_TOKEN` = paste token

**Verify:**

```bash
npm whoami
# Should show your npm username
```

### Slack Webhook (Optional)

For Slack notifications on publish events:

1. Go to your Slack workspace
2. Create incoming webhook
3. Copy webhook URL
4. GitHub repo → Settings → Secrets → Actions
5. Create new secret: `SLACK_WEBHOOK_URL` = paste URL

---

## Best Practices

### 1. Always Create Feature Branches

```bash
# Good
git checkout -b feat/new-feature
git checkout -b fix/bug-fix
git checkout -b docs/update-readme

# Bad
git commit directly to main
```

### 2. Use Conventional Commits

Following the pattern: `type: description`

```bash
git commit -m "feat: add field selection to list commands"
git commit -m "fix: pdf export format error handling"
git commit -m "docs: update publishing guide"
git commit -m "chore: update dependencies"
git commit -m "refactor: simplify list options parsing"
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `chore:` — Dependencies, configs, etc.
- `refactor:` — Code restructuring
- `test:` — Test-related changes
- `perf:` — Performance improvements

### 3. Write Meaningful Commit Messages

```bash
# Good
git commit -m "feat: add --fields parameter for field selection

- Allows users to select specific columns in output
- Works with all formats: table, json, csv, pdf, excel
- Validates field names and provides helpful error messages
- Backward compatible (defaults to all fields)"

# Bad
git commit -m "changes"
git commit -m "update"
```

### 4. Keep Commits Atomic

Each commit should be a logical unit:

```bash
# Good: separate concerns
git add src/lib/list-options.ts
git commit -m "feat: add field validation function"

git add src/cli.ts
git commit -m "feat: use field validation in commands"

# Bad: mixing unrelated changes
git add src/lib/list-options.ts src/cli.ts src/api/client.ts
git commit -m "various updates"
```

### 5. Push Before Merging

Always push to remote before creating PR:

```bash
git push origin feature/new-feature
# Then create PR on GitHub
```

### 6. Require Passing Checks

Branch protection rules enforce workflow compliance:

**Configured (recommended):**
- ✅ Require CI to pass before merge
- ✅ Require linear history
- ✅ Dismiss stale PR reviews

See GitHub repo → Settings → Branches → Branch protection rules

---

## Troubleshooting

### Pre-commit Hook Fails

**Issue:** ESLint errors block commit

**Solution:**

```bash
# Auto-fix errors
npm run lint:fix

# Re-stage fixed files
git add .

# Retry commit
git commit -m "feat: my changes"
```

### Pre-push Hook Fails

**Issue:** TypeScript, lint, or build errors block push

**Solution:**

```bash
# Check what failed
npm run typecheck    # TypeScript errors?
npm run lint         # Linting errors?
npm run build        # Build errors?

# Fix the issue, then retry
git push origin feature-branch
```

### Hook Not Running

**Issue:** Pre-commit/pre-push hooks not executing

**Solution:**

```bash
# Re-install hooks
npm run prepare

# Make sure hooks are executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# Verify installation
ls -la .husky/
# Should show pre-commit and pre-push
```

### npm audit Fails on CI

**Issue:** Security vulnerabilities found

**Solution:**

```bash
# Check locally
npm audit

# Fix automatically (if available)
npm audit fix

# Or update specific package
npm update <package-name>

# Commit and push
git add package-lock.json
git commit -m "chore: fix security vulnerabilities"
git push
```

### Publish Fails on GitHub Actions

**Issue:** Publishing workflow error

**Check:**

1. Is `NPM_TOKEN` secret configured?
   - Go to Settings → Secrets → Actions
   - Verify `NPM_TOKEN` exists

2. Is the token valid?
   ```bash
   npm whoami --token=$NPM_TOKEN
   ```

3. Check workflow logs for specific error:
   - Go to `Actions` → `Publish to npm` → failed run
   - Click job and step for details

**Common errors:**
- "You must be logged in" → NPM_TOKEN is missing or invalid
- "version not found" → package.json version doesn't match tag
- "already published" → version already exists on npm

### How to Manually Bypass Tests (Emergency Only)

**⚠️ Last resort only:**

```bash
git push --no-verify
# ❌ DON'T DO THIS, fix the issue instead!
```

---

## Summary

| Stage | Tool | Check | Failure Effect |
|-------|------|-------|-----------------|
| **Local commit** | husky + lint-staged | ESLint | Blocks commit |
| **Local push** | husky pre-push | TypeScript + ESLint + Build | Blocks push |
| **Remote PR** | GitHub Actions CI | Lint + TypeScript + Build + Test | Blocks merge |
| **Release** | GitHub Actions Publish | All checks + npm publish | Failed publish |
| **Daily** | GitHub Actions Security | npm audit | Warning |

## Workflow Diagram

```
Feature Branch
    ↓
Local Commit → [pre-commit hook: lint] → OK/FAIL
    ↓
Local Push → [pre-push hook: typecheck + lint + build] → OK/FAIL
    ↓
GitHub PR → [CI workflow: lint + typecheck + build + test] → OK/FAIL
    ↓
Merge to main
    ↓
Create Release
    ↓
[Publish workflow: publish to npm] → ✅ Live on npmjs.com
```

## Next Steps

1. **Install dependencies:** `npm install` (hooks auto-setup)
2. **Try committing:** Make small change, commit, watch hooks run
3. **Try pushing:** Make change, commit, push, watch pre-push checks
4. **View CI logs:** Push a PR, check GitHub Actions
5. **Test publish:** Use Manual Publish workflow with `beta` tag
6. **Create release:** Tag main, create release for auto-publish
