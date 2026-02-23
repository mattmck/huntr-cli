# Automatic Changelog Generation

Guide to the automatic changelog generation system for huntr-cli.

## Overview

The huntr-cli project uses **Conventional Commits** + **Keep a Changelog** format for automatic changelog generation. The release.yml workflow automatically generates changelog sections from git commits when versions are bumped.

## How It Works

### 1. Conventional Commits

All commits follow this format:

```
type: description

optional body
```

**Types that appear in changelog:**
- `feat:` → **Features** section
- `fix:` → **Bug Fixes** section
- `perf:` → **Performance** section
- `docs:` → **Documentation** section (optional)
- `chore:`, `refactor:`, `test:` → Not in changelog (internal)

**Examples:**
```bash
git commit -m "feat: add field selection with --fields parameter"
git commit -m "fix: handle missing company in activities"
git commit -m "perf: optimize color distance calculation"
```

### 2. Automatic Changelog Generation

When you push a version bump to main:

```bash
npm version minor          # 1.0.0 → 1.1.0
git push origin main --tags
```

The **release.yml** workflow:
1. Detects version change in package.json
2. Generates changelog from commit messages since last release
3. Updates CHANGELOG.md with new version section
4. Creates GitHub Release with auto-generated notes

### 3. Keep a Changelog Format

The CHANGELOG.md follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New features coming soon

## [1.1.0] - 2026-02-23

### Added
- Field selection with --fields parameter
- PDF export format
- Excel export format

### Fixed
- Handling of missing company in activities
- ESLint configuration warnings

### Performance
- Optimized color distance calculation

## [1.0.0] - 2026-02-15

Initial release with core CLI functionality.
```

## Creating Releases

### Automatic (Recommended)

```bash
# On main branch
git checkout main
git pull origin main

# Bump version (creates commit + tag)
npm version minor        # For new features
npm version patch        # For bug fixes
npm version major        # For breaking changes

# Push with tags (triggers release.yml)
git push origin main --tags

# GitHub Release is created automatically with:
# - Artifacts (tar.gz, zip)
# - Auto-generated changelog
# - Release notes from commits
```

### Manual (For Special Cases)

Go to GitHub Actions → Manual Publish workflow → Run workflow

Specify:
- Version (e.g., 1.1.0)
- npm tag (latest, beta, rc)
- Changelog notes (optional)

## Changelog Sections

### [Added]
New features introduced:
```
- Field selection with --fields parameter
- PDF export format via pdfkit
- Excel export format via exceljs
```

### [Changed]
Changes to existing functionality:
```
- Updated ESLint configuration
- Improved error handling
- Refactored API client
```

### [Fixed]
Bug fixes:
```
- Fixed missing company in activities
- Resolved npm publishing issues
- Fixed ESLint configuration
```

### [Deprecated]
Features being phased out:
```
- Old token authentication method (use environment variable instead)
```

### [Removed]
Features removed:
```
- Removed deprecated API endpoints
```

### [Security]
Security fixes:
```
- Fixed dependency vulnerabilities
- Updated security audit process
```

### [Performance]
Performance improvements:
```
- Optimized color distance calculation
- Improved table rendering speed
```

## Git Commit Examples

### Good Commits (Appear in Changelog)
```bash
git commit -m "feat: add --fields parameter for field selection"
git commit -m "feat: implement PDF export using pdfkit"
git commit -m "fix: handle missing company references in activities"
git commit -m "perf: optimize table rendering with memoization"
```

### Internal Commits (Don't Appear)
```bash
git commit -m "chore: update dependencies"
git commit -m "refactor: reorganize utility functions"
git commit -m "test: add test suite for workflows"
git commit -m "ci: update GitHub Actions configuration"
```

## Release Timeline

```
Monday 2:00 PM  → Developer commits to feature branch
                   - "feat: add new feature"
                   - "fix: resolve issue"

Monday 3:00 PM  → PR merged to main
                   - All CI checks pass
                   - Code review approved

Monday 3:05 PM  → Release triggered
                   git checkout main
                   npm version minor  # 1.0.0 → 1.1.0
                   git push origin main --tags
                          ↓
                   release.yml workflow triggers
                   
Monday 3:10 PM  → Changelog generated
                   - Collects commits since v1.0.0
                   - Groups by type (feat, fix, perf)
                   - Updates CHANGELOG.md
                   - Creates GitHub Release
                   - Adds artifacts (tar.gz, zip)
                          ↓
                   publish.yml workflow triggers
                   
Monday 3:15 PM  → NPM publish
                   - Runs full CI pipeline
                   - npm publish
                   - Comments on release with npm URL
                   
Monday 3:20 PM  ✅ huntr-cli@1.1.0 live on npmjs.com
```

## Changelog Examples

### Feature Release (1.0.0 → 1.1.0)

**Commits:**
```
feat: add field selection with --fields parameter
feat: implement PDF export using pdfkit
feat: implement Excel export using exceljs
fix: handle missing company in activities
perf: optimize list command performance
```

**Resulting Changelog Section:**
```markdown
## [1.1.0] - 2026-02-23

### Added
- Field selection with --fields parameter
- PDF export format for all list commands
- Excel export format (.xlsx) for spreadsheet import
- PDF and Excel export via pdfkit and exceljs libraries

### Fixed
- Handle missing company references in activities output

### Performance
- Optimized list command rendering performance
```

### Patch Release (1.1.0 → 1.1.1)

**Commits:**
```
fix: incorrect field mapping in CSV export
fix: ESLint configuration warnings
```

**Resulting Changelog Section:**
```markdown
## [1.1.1] - 2026-02-24

### Fixed
- Correct field mapping in CSV export
- Resolve ESLint configuration warnings
```

## Pre-release Versions

### Beta Release

```bash
npm version prerelease         # 1.0.0 → 1.0.1-0
git push origin main --tags
# In Manual Publish:
#   version: 1.0.1-0
#   npm_tag: beta
```

Users can install with:
```bash
npm install -g huntr-cli@beta
```

### Release Candidate

```bash
npm version 1.1.0-rc.1
git push origin main --tags
# In Manual Publish:
#   version: 1.1.0-rc.1
#   npm_tag: rc
```

Users can test with:
```bash
npm install -g huntr-cli@rc
```

## Verifying Changelog

### Check Generated Changelog

```bash
# After release, view CHANGELOG.md
cat CHANGELOG.md | head -50

# Should show new version section with:
# - Date
# - Features (from feat: commits)
# - Fixes (from fix: commits)
# - Performance (from perf: commits)
```

### Check GitHub Release

1. Go to GitHub repo
2. Releases tab
3. Click latest release
4. Verify:
   - Version number
   - Release date
   - Changelog notes
   - Artifacts (tar.gz, zip)
   - npm URL comment

### Check npm Registry

```bash
# View changelog/release notes
npm view huntr-cli@1.1.0

# Install latest
npm install -g huntr-cli@latest

# Verify version
huntr --version
```

## Updating CHANGELOG Manually

If you need to edit the changelog:

1. Edit CHANGELOG.md directly
2. Follow Keep a Changelog format
3. Commit with `docs: update CHANGELOG.md`
4. This commit won't trigger release.yml
5. Next version bump will use current CHANGELOG.md

**Example:**
```bash
# Edit CHANGELOG.md
# Add manual notes, fix formatting, etc.
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG.md with release notes"
```

## Troubleshooting

### Changelog Not Generated

**Check:**
1. Version actually changed in package.json
2. Commit message was pushed with tags
3. release.yml workflow ran successfully
4. Check workflow logs in GitHub Actions

**Fix:**
```bash
# If version didn't bump:
npm version minor
git push origin main --tags

# If tags didn't push:
git push origin main --tags  # Explicitly push tags
```

### Missing Commits in Changelog

**Reason:** Commit type doesn't start with `feat:`, `fix:`, `perf:`, etc.

**Check:**
```bash
# View last 10 commits
git log --oneline -10

# Should see: feat:, fix:, perf: prefixes
```

**Fix:** Only `feat:`, `fix:`, and `perf:` commits appear in changelog automatically.

### Changelog Format Wrong

**Fix:**
1. Manual edit CHANGELOG.md
2. Follow [keepachangelog.com](https://keepachangelog.com/) format
3. Commit with `docs: fix CHANGELOG format`

## Best Practices

✅ **DO**
- Use conventional commit format for all user-facing changes
- Write clear, concise commit messages
- Group related changes in same PR
- Update CHANGELOG.md manually if needed
- Review generated changelog before publishing

❌ **DON'T**
- Mix internal and user-facing changes in single commit
- Use non-standard commit prefixes
- Forget to bump version before publishing
- Edit CHANGELOG.md after release (edit before next version)

## See Also

- [AUTOMATIC-PUBLISHING.md](./AUTOMATIC-PUBLISHING.md) — Publishing workflow
- [DEV-SETUP.md](./DEV-SETUP.md) — Development setup
- [Conventional Commits](https://www.conventionalcommits.org/) — Commit format spec
- [Keep a Changelog](https://keepachangelog.com/) — Changelog format spec
