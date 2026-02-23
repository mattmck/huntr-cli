# Automatic Publishing Guide

Complete guide to huntr-cli's automatic release and publishing workflow.

## Overview

Publishing is **completely automated** once you bump the version and merge to main:

```
git checkout main
npm version minor  # 1.0.0 → 1.1.0
git push origin main
# ↓
GitHub Release created automatically
↓
npm published automatically
↓
Artifacts uploaded
```

## Workflow Architecture

### Release Workflow (`.github/workflows/release.yml`)

Triggers when version is bumped on main branch.

**What it does:**
1. Detects version change in package.json
2. Runs full CI (lint, typecheck, build)
3. Creates tar.gz and zip archives
4. Creates git tag (`v1.1.0`)
5. Creates GitHub Release with changelog
6. Uploads distribution artifacts
7. Triggers publish workflow

### Publish Workflow (`.github/workflows/publish.yml`)

Triggers when GitHub Release is published.

**What it does:**
1. Runs full CI pipeline
2. Publishes to npm registry
3. Comments on release with npm URL

## Publishing Methods

### Method 1: Automatic (Recommended)

**Simplest method** — Everything is automatic after version bump!

```bash
# 1. On main branch
git checkout main
git pull origin main

# 2. Bump version (creates commit with git tag)
npm version minor        # 1.0.0 → 1.1.0
# OR
npm version patch        # 1.0.0 → 1.0.1
# OR
npm version major        # 1.0.0 → 2.0.0

# 3. Push with tags
git push origin main --tags

# ✅ Done! Release workflow triggers automatically
# ✅ GitHub Release created
# ✅ npm published automatically
# ✅ Artifacts uploaded
```

**What happens automatically:**
- GitHub Actions creates GitHub Release
- Distribution archives created (tar.gz, zip)
- Artifacts uploaded to GitHub
- npm publish triggered
- Release comments updated with npm URL

### Method 2: Manual (Emergency Only)

For when automatic publishing fails or needs manual intervention:

1. Go to GitHub Actions
2. Click "Manual Publish" workflow
3. Enter version (e.g., `1.1.0`)
4. Select npm tag (`latest`, `beta`, etc.)
5. Run workflow

---

## Version Bumping

### Using `npm version`

The recommended way:

```bash
# Patch release (bug fixes)
npm version patch
# 1.0.0 → 1.0.1

# Minor release (new features)
npm version minor
# 1.0.0 → 1.1.0

# Major release (breaking changes)
npm version major
# 1.0.0 → 2.0.0

# Pre-release
npm version prerelease
# 1.0.0 → 1.0.1-0

# Custom version
npm version 1.5.0
```

**What `npm version` does automatically:**
- Updates version in package.json
- Updates version in package-lock.json
- Creates commit with message `v1.1.0`
- Creates git tag `v1.1.0`
- Does NOT push (you do that)

### Manual Version Update (Not Recommended)

Only do this if you need full control:

```bash
# 1. Edit package.json manually
vim package.json
# Change "version": "1.0.0" to "1.0.1"

# 2. Create git tag manually
git add package.json
git commit -m "chore: bump version to 1.0.1"
git tag v1.0.1
git push origin main --tags
```

---

## Workflow Triggers

### Release Workflow Triggers On

**Main branch receives commit with:**
- `[release]` in commit message, OR
- `chore(release)` in commit message, OR
- Commit message starts with `v`

**Examples that trigger:**
```bash
npm version patch  # Creates commit "v1.0.1"
git commit -m "[release] prepare version 1.0.1"
git commit -m "chore(release): bump to 1.0.1"
```

### Publish Workflow Triggers On

**GitHub Release published** (created by Release workflow)

---

## Artifacts in GitHub Releases

### What Gets Uploaded

**Distribution Archives:**
- `huntr-cli-1.1.0.tar.gz` — Gzipped tarball
- `huntr-cli-1.1.0.zip` — ZIP archive

Both contain compiled `dist/` directory ready to use.

**Where to find:**
1. GitHub repo
2. Releases tab
3. Click release version
4. Scroll down to see assets

**Download URL:**
```
https://github.com/mattmck/huntr-cli/releases/download/v1.1.0/huntr-cli-1.1.0.tar.gz
```

### Use Cases for Artifacts

**Users can download pre-built binaries:**
```bash
# Download and extract
wget https://github.com/mattmck/huntr-cli/releases/download/v1.1.0/huntr-cli-1.1.0.tar.gz
tar xzf huntr-cli-1.1.0.tar.gz

# Or use npm (recommended)
npm install -g huntr-cli
```

---

## Git Tag vs GitHub Release

### Git Tags

Created automatically by `npm version`:
```bash
git tag v1.1.0
git push origin v1.1.0
```

**Used for:**
- Marking commits in git history
- Release workflow detection
- Version tracking

### GitHub Releases

Created automatically by Release workflow:
- Release page on GitHub
- Download artifacts
- Release notes
- Announcement

**Includes:**
- Changelog (auto-generated from commits)
- Artifacts (tar.gz, zip)
- npm URL (from publish workflow)

---

## Complete Release Timeline

```
Day 1: Feature Work
    ↓
git checkout -b feat/my-feature
edit src/
npm run lint:fix && npm run build
git add . && git commit -m "feat: add feature"
git push origin feat/my-feature
    ↓
GitHub PR created
GitHub Actions CI runs (lint, build, test)
    ↓
PR reviewed and merged to main
    ↓
Day 2: Release
    ↓
git checkout main && git pull
npm version minor  # Creates commit + tag
git push origin main --tags
    ↓
[Release Workflow] Triggers automatically
- Detects version bump
- Runs full CI
- Creates archives
- Creates GitHub Release
    ↓
Release created on GitHub with:
- Artifacts (tar.gz, zip)
- Changelog
- Ready for publishing
    ↓
[Publish Workflow] Triggers automatically
- Publishes to npm
- Comments on release
    ↓
✅ Live on npmjs.com!
Users can: npm install -g huntr-cli
```

---

## Checklist Before Releasing

- [ ] All changes merged to main
- [ ] CI passing on main (all green checks)
- [ ] README.md updated if needed
- [ ] CHANGELOG.md updated with new features
- [ ] No breaking changes (or clearly documented)
- [ ] Tests passing
- [ ] Lint passing locally
- [ ] Build successful locally

---

## Troubleshooting

### Release Failed to Create

**Check:**
1. Push included `--tags` flag?
   ```bash
   git push origin main --tags
   ```

2. Commit message triggers release?
   - Should start with `v` or contain `[release]`
   - `npm version` creates correct format automatically

3. Version in package.json updated?
   ```bash
   grep '"version"' package.json
   ```

### Publish Failed

**Check:**
1. NPM_TOKEN secret configured?
   - Settings → Secrets → Actions
   - `NPM_TOKEN` exists and is valid

2. Version already published?
   ```bash
   npm view huntr-cli version
   ```
   - Can't publish same version twice
   - Bump version and retry

3. Build failed?
   - Check Actions logs
   - Fix issues locally
   - Create new release

### Both Failed

1. Check Actions tab for error logs
2. Fix locally (lint, build, typecheck)
3. Create new version tag
4. Push to trigger workflows again

---

## Manual Recovery

If automated workflows fail completely:

```bash
# Manually build and publish
npm run build
npm publish --tag latest

# Create release manually
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 --generate-notes

# Upload artifacts manually
gh release upload v1.1.0 ./dist-archives/*
```

---

## Monitoring Releases

### Check Status

**GitHub:**
1. Go to repo
2. Actions tab
3. See Release and Publish workflows

**npm:**
```bash
npm view huntr-cli version        # Latest version
npm view huntr-cli versions       # All versions
npm info huntr-cli                # Full details
```

**Command line:**
```bash
# Check what's live on npm
npm view huntr-cli@latest

# Install latest
npm install -g huntr-cli@latest

# Verify installation
huntr --version
```

---

## Pre-release Versions

### Beta Release

For testing before stable release:

```bash
npm version prerelease  # 1.1.0 → 1.1.1-0
git push origin main --tags
# Then in Manual Publish workflow:
# version: 1.1.1-0
# npm_tag: beta
```

Users can install:
```bash
npm install -g huntr-cli@beta
```

### RC (Release Candidate)

```bash
npm version 1.1.0-rc.1
git push origin main --tags
# Manual Publish with npm_tag: rc
```

Users can test:
```bash
npm install -g huntr-cli@rc
```

---

## Release Notes Template

The changelog is auto-generated from commits. Format your commits properly:

```bash
git commit -m "feat: add feature description"
git commit -m "fix: resolve issue description"
git commit -m "docs: update documentation"
git commit -m "perf: improve performance"
```

These appear automatically in release notes!

---

## Security & Stability

### Before Releasing

✅ **Always:**
- Wait for CI to pass
- Test locally: `npm run build && npm run lint && npm run typecheck`
- Review changes one more time
- Update CHANGELOG.md
- Update version number only once per release

❌ **Never:**
- Force-push after tagging
- Publish from unverified commits
- Skip CI checks
- Release untested code

### After Publishing

1. Verify npm shows new version
2. Test installation: `npm install -g huntr-cli@latest`
3. Run basic commands: `huntr --version`, `huntr me`
4. Post release announcement (optional)

---

## GitHub Release URL Format

```
https://github.com/mattmck/huntr-cli/releases/tag/v1.1.0
```

Direct download URLs:
```
https://github.com/mattmck/huntr-cli/releases/download/v1.1.0/huntr-cli-1.1.0.tar.gz
https://github.com/mattmck/huntr-cli/releases/download/v1.1.0/huntr-cli-1.1.0.zip
```

---

## Environment Variables

### Required Secrets

**NPM_TOKEN**
- Generate on npmjs.com: Profile → Access Tokens
- Must be "Automation" level token
- Add to GitHub: Settings → Secrets → Actions

**GITHUB_TOKEN**
- Provided automatically by GitHub Actions
- No setup needed

### Optional Secrets

**SLACK_WEBHOOK_URL**
- For Slack notifications
- Create webhook in Slack workspace
- Add to GitHub secrets for manual publish workflow

---

## Summary

| What | When | How |
|------|------|-----|
| **Bump version** | Before release | `npm version minor/patch/major` |
| **Create release** | After push with tags | Automatic (Release workflow) |
| **Publish npm** | After release created | Automatic (Publish workflow) |
| **View artifacts** | After release | GitHub Releases page |
| **Install** | Anytime | `npm install -g huntr-cli` |

---

## Quick Reference

```bash
# Complete release in 3 commands
npm version minor
git push origin main --tags
# Wait for workflows to complete (check Actions tab)

# Verify
npm view huntr-cli version
npm install -g huntr-cli
huntr --version
```

That's it! Everything else is automatic. 🚀
