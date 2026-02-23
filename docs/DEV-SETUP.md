# Development Setup Guide

Complete guide for setting up huntr-cli for local development with all tools configured.

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/mattmck/huntr-cli.git
cd huntr-cli
```

### 2. Install Dependencies

```bash
npm install
# Automatically:
# - Installs all npm packages
# - Runs "prepare" script to setup git hooks with husky
# - Configures pre-commit and pre-push hooks
```

### 3. Verify Setup

```bash
npm run build      # Should compile with no errors
npm run lint       # Should pass (warnings ok)
npm run typecheck  # Should pass
```

---

## Available Commands

### Development

```bash
# Load .env if needed by prefixing with HUNTR_LOAD_ENV=true
HUNTR_LOAD_ENV=true npm run dev -- me                    # Run CLI in dev mode
HUNTR_LOAD_ENV=true npm run dev -- boards list           # List boards
HUNTR_LOAD_ENV=true npm run dev -- activities list <id>  # List activities
```

### Building & Testing

```bash
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Check TypeScript types (no emit)
npm run lint       # Check code style (errors only)
npm run lint:fix   # Auto-fix style issues
npm test           # Run tests (currently none)
```

### Git Hooks

```bash
# These run automatically
npm run prepare    # Install git hooks manually
```

---

## Git Workflow

### Create Feature Branch

```bash
git checkout -b feat/new-feature
# or
git checkout -b fix/bug-fix
git checkout -b docs/update-readme
```

### Make Changes

```bash
# Edit files
nano src/cli.ts

# Check style (pre-commit will do this too)
npm run lint:fix

# Test locally
npm run dev -- boards list

# Build and typecheck
npm run build
npm run typecheck
```

### Commit Changes

```bash
# Stage files
git add src/

# Commit with conventional message
git commit -m "feat: add new feature"

# ⚠️ Pre-commit hook runs here:
# - Lints staged files
# - Blocks commit if errors found
# - Auto-fixes some issues

# If hook fails, fix errors and retry
git add .
git commit -m "feat: add new feature"
```

### Push to Remote

```bash
git push origin feat/new-feature

# ⚠️ Pre-push hook runs here:
# - Typecheck
# - Lint all files
# - Build
# - Blocks push if any fail
```

### Create Pull Request

1. Go to GitHub repository
2. Click "Create Pull Request"
3. Fill in title and description
4. Create PR

### Wait for CI

- GitHub Actions runs automatically
- Check `Actions` tab for status
- All jobs must pass (green checkmarks)
- Cannot merge if CI fails

### Merge to Main

```bash
# Via GitHub UI (Squash merge recommended)
# OR locally:
git checkout main
git pull origin main
git merge feat/new-feature
git push origin main
```

---

## Pre-commit Hook Details

**What it does:** Lints only the files you're committing

**When:** Before `git commit` succeeds

**Behavior:**
- ✅ Runs ESLint on staged `.ts` files
- ✅ Auto-fixes fixable issues
- ✅ Stages fixed files
- ❌ Blocks commit if non-fixable errors found

**Example:**

```bash
$ git commit -m "feat: add feature"

🔍 Running pre-commit checks...
  ✓ src/cli.ts (fixed 2 issues)
✓ Pre-commit checks passed

[feat/new-feature abc1234] feat: add feature
```

**If it fails:**

```bash
$ git commit -m "feat: add feature"

🔍 Running pre-commit checks...
  ✗ src/lib/list-options.ts
    error: Missing trailing comma (comma-dangle)
    error: Unexpected any type (no-explicit-any)
❌ Linting failed. Please fix errors and try again.

# Fix errors
vim src/lib/list-options.ts

# Re-stage and retry
git add .
git commit -m "feat: add feature"
```

**Manual linting:**

```bash
npm run lint       # Check all files
npm run lint:fix   # Auto-fix issues
```

---

## Pre-push Hook Details

**What it does:** Comprehensive checks before pushing

**When:** Before `git push` succeeds

**Checks (in order):**
1. TypeScript compilation (`npm run typecheck`)
2. ESLint all files (`npm run lint`)
3. Build to dist/ (`npm run build`)

**Example:**

```bash
$ git push origin feat/new-feature

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
Total 3 (delta 0), reused 0 (delta 0)
To github.com:mattmck/huntr-cli.git
   abc1234..def5678  feat/new-feature -> feat/new-feature
```

**If it fails:**

```bash
$ git push origin feat/new-feature

🧪 Running pre-push checks...
📋 Typechecking...
  ❌ TypeScript errors found

# Fix issues locally
npm run typecheck  # See what's wrong
# Edit files to fix
npm run build
npm run lint

# Retry push
git push origin feat/new-feature
```

---

## ESLint Configuration

**File:** `eslint.config.js` (modern flat config)

**What's checked:**
- TypeScript type safety
- Code style (quotes, semicolons, trailing commas)
- Unused variables
- Unneeded assignments
- No console.log in production (warning)

**Fix style issues:**

```bash
npm run lint:fix
```

**Common issues:**
- Missing trailing commas in objects/arrays
- Wrong quote style (should be single quotes)
- Missing semicolons

All can be auto-fixed with `npm run lint:fix`.

---

## Debugging

### Run CLI with Debug Output

```bash
DEBUG=* npm run dev -- boards list
```

### Check Node Version

```bash
node --version
# Should be 18+
```

### Clear Cache & Reinstall

```bash
rm -rf node_modules package-lock.json
npm install
```

### Bypass Hooks (Emergency Only)

```bash
# Skip pre-commit
git commit --no-verify

# Skip pre-push
git push --no-verify
```

**⚠️ Not recommended:** These should only be used in emergencies. Better to fix the issue!

---

## Project Structure

```
huntr-cli/
├── src/
│   ├── cli.ts              # Main CLI entry point
│   ├── types/              # Type definitions
│   ├── api/                # API clients
│   ├── config/             # Configuration management
│   ├── commands/           # CLI commands
│   └── lib/                # Shared utilities
├── dist/                   # Compiled output (git ignored)
├── .github/
│   └── workflows/          # GitHub Actions
├── .husky/                 # Git hooks
├── completions/            # Shell completions
├── docs/                   # Documentation
├── eslint.config.js        # ESLint configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies & scripts
└── README.md               # Project README
```

---

## Conventional Commits

Follow this format for commit messages:

```
type: subject

body (optional)
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `chore:` — Build tools, dependencies
- `refactor:` — Code restructuring
- `test:` — Test-related changes
- `perf:` — Performance improvements

**Examples:**

```bash
git commit -m "feat: add field selection to list commands"
git commit -m "fix: handle missing company in activities"
git commit -m "docs: add CI/CD setup guide"
git commit -m "chore: update dependencies"
```

---

## Tips & Tricks

### Quick Lint & Build

```bash
npm run lint:fix && npm run build && npm run typecheck
```

### Test Changes Before Commit

```bash
npm run dev -- <your-command>
npm run build
npm run typecheck
npm run lint
```

### View What Will Be Committed

```bash
git diff --cached
git status
```

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Check Git Hooks Status

```bash
ls -la .husky/
# Should show pre-commit and pre-push
```

### Reinstall Hooks

```bash
npm run prepare
```

---

## Troubleshooting

### "Hooks not running"

**Solution:**
```bash
npm run prepare
chmod +x .husky/pre-commit .husky/pre-push
```

### "Module not found" errors

**Solution:**
```bash
npm install
npm run build
```

### "TypeScript errors"

**Solution:**
```bash
npm run typecheck
# Read errors and fix
```

### "ESLint errors"

**Solution:**
```bash
npm run lint        # See issues
npm run lint:fix    # Auto-fix
git add .
git commit -m "..."
```

### "Build fails"

**Solution:**
```bash
npm run build 2>&1 | head -20
# Read error, fix issue
npm run build
```

---

## Next Steps

1. **Clone & install:** `git clone ... && npm install`
2. **Verify setup:** `npm run build && npm run lint && npm run typecheck`
3. **Try a change:** Edit `src/cli.ts`, run `npm run dev`, commit, push
4. **Check hooks:** Notice pre-commit and pre-push running
5. **Read docs:** See `docs/` for detailed information

---

## Documentation Index

- **CI/CD Setup:** `docs/CI-CD-SETUP.md`
- **GitHub Actions:** `docs/GITHUB-ACTIONS-GUIDE.md`
- **Output Formats:** `docs/OUTPUT-FORMATS.md`
- **Output Examples:** `docs/OUTPUT-EXAMPLES.md`
- **npm Publishing:** `docs/NPM-PUBLISHING.md`
- **Enhancement Plan:** `docs/ENHANCEMENT-PLAN.md`

---

## Quick Commands Reference

```bash
# Development
npm run dev -- <command>        # Run CLI in dev mode
npm run dev -- --help           # See all commands

# Quality
npm run lint                     # Check code style
npm run lint:fix                 # Fix style issues
npm run typecheck                # Check TypeScript
npm run build                    # Build project
npm test                         # Run tests

# Git (automatic with hooks)
git add .                        # Stage changes
git commit -m "type: message"    # Triggers pre-commit hook
git push origin branch           # Triggers pre-push hook
```

---

## Support

- **Lint issues?** Run `npm run lint:fix`
- **Type errors?** Run `npm run typecheck` to see details
- **Build failing?** Run `npm run build` for error details
- **Git hooks?** See `docs/CI-CD-SETUP.md`
- **Publishing?** See `docs/NPM-PUBLISHING.md`
