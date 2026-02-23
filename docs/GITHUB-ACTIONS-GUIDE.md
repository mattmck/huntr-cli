# GitHub Actions Workflows Guide

Quick reference for all GitHub Actions workflows in this project.

## Summary

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| **CI** | Push, PR | Lint, typecheck, build, test | Always runs |
| **Publish** | Release created | Auto-publish to npm | Production |
| **Manual Publish** | Manual dispatch | On-demand publish with version | Optional |
| **Security Audit** | Daily, push, manual | Check dependencies | Monitoring |

---

## Workflow Details

### CI Workflow (`.github/workflows/ci.yml`)

**Runs on:** Every push to `main`/`develop`, every PR

**Jobs:**
- `lint` — ESLint all TypeScript files
- `typecheck` — TypeScript compilation check
- `build` — Build to dist/
- `test` — Run tests

**Status:** ✅ Passing all checks

**View logs:** `Actions` → workflow run → job → step

**What to do if it fails:**
1. Click the failed job in Actions tab
2. Read error message
3. Fix locally: `npm run lint:fix`, `npm run typecheck`, `npm run build`
4. Commit and push fix

---

### Publish Workflow (`.github/workflows/publish.yml`)

**Runs on:** GitHub Release published

**How to trigger:**
```bash
# 1. Tag and push
git tag v1.1.0
git push origin v1.1.0

# 2. Create release (GitHub CLI)
gh release create v1.1.0 --generate-notes

# OR create in GitHub UI:
# Releases → Create new release → select tag → Publish
```

**What it does:**
1. Checks out code
2. Installs dependencies
3. Runs lint, typecheck, build
4. **Publishes to npm** with NPM_TOKEN
5. Comments on release with result

**Requirements:**
- `NPM_TOKEN` secret configured

**View logs:** `Actions` → `Publish to npm` → run

---

### Manual Publish Workflow (`.github/workflows/manual-publish.yml`)

**Runs on:** Manual trigger via GitHub UI

**How to trigger:**
1. Go to GitHub repo
2. `Actions` tab
3. `Manual Publish` workflow (left sidebar)
4. Click `Run workflow`
5. Enter version (e.g., `1.1.0-beta.1`)
6. Select npm tag (`latest`, `beta`, `rc`)
7. Click `Run workflow`

**What it does:**
1. Validates version format
2. Updates package.json
3. Runs full CI pipeline
4. Publishes to npm
5. Creates git tag and GitHub Release
6. (Optional) Posts to Slack

**Use cases:**
- Publishing pre-releases (beta, RC)
- Emergency patches
- Skipping GitHub Release step

**Requirements:**
- `NPM_TOKEN` secret
- `SLACK_WEBHOOK_URL` (optional)

---

### Security Audit Workflow (`.github/workflows/security-audit.yml`)

**Runs on:**
- Daily at midnight UTC
- Every push to main/develop
- Manual via Actions tab

**What it does:**
- Installs dependencies
- Runs `npm audit` (moderate+ severity)
- Uploads report as artifact

**View report:**
1. `Actions` → `Security Audit` → latest run
2. Download artifacts
3. Review audit-report.json

**What to do if vulnerabilities found:**
```bash
npm audit
npm audit fix
git add package-lock.json
git commit -m "chore: fix security vulnerabilities"
git push
```

---

## Setup Checklist

### First Time Setup

- [ ] Clone repo: `git clone https://github.com/mattmck/huntr-cli.git`
- [ ] Install dependencies: `npm install` (hooks auto-setup)
- [ ] Configure `NPM_TOKEN` secret in GitHub
- [ ] (Optional) Configure `SLACK_WEBHOOK_URL` secret

### NPM Token Setup

1. Go to [npmjs.com](https://npmjs.com)
2. Profile → Access Tokens
3. Generate new token (Automation level)
4. Copy token (starts with `npm_`)
5. GitHub repo → Settings → Secrets and variables → Actions
6. New secret: name `NPM_TOKEN`, value = paste token

### Slack Setup (Optional)

1. Go to your Slack workspace settings
2. Create incoming webhook
3. Copy webhook URL
4. GitHub repo → Settings → Secrets → Actions
5. New secret: name `SLACK_WEBHOOK_URL`, value = webhook URL

---

## Publishing Workflow

### 1. Make Changes & Commit

```bash
# Create feature branch
git checkout -b feat/new-feature

# Make changes
npm run lint:fix  # Format code
npm run build     # Verify build works

# Commit
git add src/
git commit -m "feat: add new feature"
```

### 2. Create Pull Request

```bash
git push origin feat/new-feature
# Go to GitHub, create PR
# Wait for CI to pass (all green checks)
```

### 3. Merge to Main

```bash
# Via GitHub UI or:
git checkout main
git pull origin main
git merge feat/new-feature
git push origin main
```

### 4. Publish to npm

**Option A: Automatic (Recommended)**
```bash
# Create tag from main
git tag v1.1.0
git push origin v1.1.0

# Create release in GitHub (auto-publishes)
gh release create v1.1.0 --generate-notes
```

**Option B: Manual**
1. Go to GitHub Actions
2. `Manual Publish` workflow
3. Enter version `1.1.0`
4. Select npm tag `latest`
5. Run

---

## Troubleshooting

### CI Fails on PR

**Check:** Which job failed?
- `lint` → Run `npm run lint:fix`
- `typecheck` → Fix TypeScript errors
- `build` → Run `npm run build` locally
- `test` → Check test output

**Fix locally, then:**
```bash
git add .
git commit -m "fix: resolve CI errors"
git push origin feature-branch
```

### Publish Fails

**Check logs:**
1. `Actions` → `Publish to npm` (or `Manual Publish`)
2. Click failed run
3. Click failed job
4. Read error message

**Common issues:**
- NPM_TOKEN missing/invalid → Check Settings → Secrets
- Version already published → Use new version
- TypeScript errors → Fix with `npm run typecheck`
- Lint errors → Fix with `npm run lint:fix`

### How to Re-run Failed Workflow

1. Go to `Actions` tab
2. Click workflow
3. Click the failed run
4. Click `Re-run failed jobs` (or `Re-run all jobs`)

---

## Workflow Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/publish.yml` | Auto-publish on release |
| `.github/workflows/manual-publish.yml` | On-demand publish |
| `.github/workflows/security-audit.yml` | Daily security checks |

---

## Local Development Commands

```bash
# Lint
npm run lint              # Check style
npm run lint:fix          # Auto-fix style

# Typecheck
npm run typecheck         # Check TS compilation

# Build
npm run build             # Build to dist/

# Combined (what pre-push hook does)
npm run lint && npm run typecheck && npm run build
```

---

## Branch Protection Rules (Recommended)

Set up in GitHub Settings → Branches → Branch protection rules for `main`:

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require code reviews before merging
- ✅ Dismiss stale pull request approvals
- ✅ Require linear history

---

## Monitoring Dashboard

**View all workflows:** GitHub repo → `Actions` tab

**Recent runs:**
```bash
# Using GitHub CLI
gh run list --workflow=ci.yml -L 5
gh run list --workflow=publish.yml -L 5
gh run list --workflow=security-audit.yml -L 5
```

**Trigger manual workflows:**
```bash
gh workflow run security-audit.yml
gh workflow run manual-publish.yml -f version=1.1.0-beta.1 -f npm_tag=beta
```

---

## CI/CD Status Badge

Add to README.md:

```markdown
[![CI](https://github.com/mattmck/huntr-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/mattmck/huntr-cli/actions)
```

Result: [![CI](https://img.shields.io/github/actions/workflow/status/mattmck/huntr-cli/ci.yml?branch=main)](https://github.com/mattmck/huntr-cli/actions)

---

## Best Practices

1. **Always wait for CI to pass** before merging PRs
2. **Use conventional commits** in messages (feat:, fix:, etc.)
3. **Keep commits atomic** (one logical change per commit)
4. **Push to feature branch, create PR** (don't commit to main)
5. **Create release from main branch** only
6. **Review workflow logs** if something fails

---

## Summary Diagram

```
Development
    ↓
Feature Branch
    ↓
Create PR
    ↓
[CI: lint, typecheck, build, test]
    ↓
Merge to main
    ↓
Create Release/Tag
    ↓
[Publish: build + publish to npm]
    ↓
✅ Live on npmjs.com
```

---

## Need Help?

- **Workflow failed?** Check `Actions` tab logs
- **Want to publish?** Use Manual Publish workflow
- **CI errors?** Run locally with `npm run lint:fix && npm run typecheck && npm run build`
- **Secrets issues?** Check Settings → Secrets → Actions
