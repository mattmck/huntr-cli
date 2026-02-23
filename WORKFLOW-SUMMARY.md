# huntr-cli Complete Workflow Summary

Comprehensive overview of the huntr-cli development, testing, and publishing workflows.

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/mattmck/huntr-cli.git
cd huntr-cli
npm install  # Automatically sets up git hooks

# 2. Verify setup
npm run build && npm run lint && npm run typecheck

# 3. Make changes
git checkout -b feat/my-feature
npm run dev -- boards list  # Test changes
npm run lint:fix            # Auto-fix style
git commit -m "feat: add feature"  # Pre-commit hook runs
git push origin feat/my-feature    # Pre-push hook runs

# 4. Create PR on GitHub
# → CI runs automatically (lint, typecheck, build, test)

# 5. Publish (from main)
npm version minor          # Bumps version
git push origin main --tags
# → release.yml creates GitHub Release
# → publish.yml publishes to npm
```

## 📋 Workflows at a Glance

### Local Development Hooks
| Hook | When | Actions |
|------|------|---------|
| **pre-commit** | On `git commit` | Lints staged files, auto-fixes, blocks if errors |
| **pre-push** | On `git push` | Typecheck → Lint → Build, blocks if any fail |

### GitHub Actions CI
| Workflow | Trigger | Actions |
|----------|---------|---------|
| **CI** | Every push + PR | Lint, typecheck, build, test (parallel) |
| **Labels** | Push to main (labels.json changed) | Syncs GitHub labels |
| **Security Audit** | Daily + push + dispatch | npm audit checks for vulnerabilities |
| **Release** | Version bump on main | Creates artifacts, GitHub Release, triggers publish |
| **Publish** | GitHub Release published | Runs CI, npm publish, comments on release |
| **Manual Publish** | Manual dispatch | Custom version + npm tag, creates release |

### Automatic Publishing Pipeline
```
npm version minor
     ↓
git push origin main --tags
     ↓
GitHub detects version change
     ↓
release.yml workflow triggers
  ├→ Creates tar.gz + zip archives
  ├→ Creates git tags
  ├→ Auto-generates changelog
  ├→ Creates GitHub Release with artifacts
  └→ Triggers publish.yml
       ↓
  publish.yml triggers
  ├→ Runs full CI pipeline
  ├→ npm publish
  └→ Comments on release with npm URL
       ↓
✅ Live on npmjs.com
```

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **DEV-SETUP.md** | Local development setup | Developers |
| **CI-CD-SETUP.md** | Git hooks configuration | Developers |
| **GITHUB-ACTIONS-GUIDE.md** | Workflow reference | DevOps/Maintainers |
| **AUTOMATIC-PUBLISHING.md** | Publishing workflow | Maintainers/Release managers |
| **TESTING.md** | Test suite & verification | QA/Developers |
| **ENTITY-TYPES.md** | Type schemas | API users |
| **OUTPUT-FORMATS.md** | Field reference | Users |
| **OUTPUT-EXAMPLES.md** | Usage examples | Users |
| **NPM-PUBLISHING.md** | Distribution explained | Users |

## 🔄 Git Workflow

### Branch Strategy
- **main** — Production-ready code
- **develop** — Integration branch (optional)
- **feat/*** — Feature branches
- **fix/*** — Bug fix branches
- **docs/*** — Documentation branches

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: update dependencies
refactor: restructure code
test: add test cases
perf: improve performance
```

### Pull Request Process
1. Create branch: `git checkout -b feat/new-feature`
2. Make changes: `npm run lint:fix && npm run build`
3. Commit: `git commit -m "feat: description"` (pre-commit hook runs)
4. Push: `git push origin feat/new-feature` (pre-push hook runs)
5. Create PR on GitHub
6. CI runs automatically (lint, typecheck, build, test)
7. Code review and approval
8. Squash merge to main

## 🧪 Testing

### Running Tests
```bash
npm test                    # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # Coverage report
```

### Test Structure
- **Command Structure** — Verifies CLI commands exist
- **Build & Compilation** — Documents CI checks
- **Git Workflow** — Verifies conventional commits
- **Publishing Workflow** — Documents release process
- **Output Formatting** — Verifies formats (table, JSON, CSV, PDF, Excel)
- **Documentation** — Confirms guides exist

### CI Test Execution
- Runs on every push and PR
- Must pass before merging
- GitHub Actions runs: `npm test`
- Uses Vitest framework

## 📦 Publishing

### Version Bumping
```bash
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
```

### Release Artifacts
Available on [GitHub Releases](https://github.com/mattmck/huntr-cli/releases):
- `huntr-cli-{version}.tar.gz` — Gzipped tarball
- `huntr-cli-{version}.zip` — ZIP archive

Both contain compiled `dist/` directory ready to use.

### Installation Methods
```bash
# From npm (recommended)
npm install -g huntr-cli

# From GitHub releases
wget https://github.com/mattmck/huntr-cli/releases/download/v1.0.0/huntr-cli-1.0.0.tar.gz
tar xzf huntr-cli-1.0.0.tar.gz
```

### Pre-release Versions
```bash
npm version prerelease              # 1.0.0 → 1.0.1-0
# Then use Manual Publish with npm_tag: beta

npm version 1.1.0-rc.1              # Release candidate
# Then use Manual Publish with npm_tag: rc
```

## 🏷️ GitHub Labels

### Type Labels
- `type/bug` — Something isn't working
- `type/feature` — New feature or enhancement
- `type/docs` — Documentation improvements
- `type/chore` — Build, dependencies, tooling
- `type/refactor` — Code restructuring
- `type/test` — Test improvements
- `type/perf` — Performance improvements

### Priority Labels
- `priority/critical` — Blocking, immediate attention
- `priority/high` — Should be addressed soon
- `priority/low` — Nice-to-have

### Status Labels
- `status/in-progress` — Currently being worked on
- `status/blocked` — Blocked by another issue
- `status/needs-review` — Waiting for code review
- `status/needs-testing` — Ready for testing

### Scope Labels
- `scope/cli` — Core CLI commands
- `scope/auth` — Authentication
- `scope/output` — Output formatting
- `scope/infra` — CI/CD and tooling

## 🔐 Security

### Pre-commit Checks
- ESLint with TypeScript rules
- Auto-fix enabled
- Blocks on errors

### Pre-push Checks
- TypeScript type checking
- Full ESLint (all files)
- Build verification

### CI Security
- Daily npm audit
- Runs on every push/PR
- Checks for medium+ vulnerabilities
- Uploads audit report as artifact

### Secrets Required
- **NPM_TOKEN** — For npm publishing
  - Generate at npmjs.com → Access Tokens
  - Must be "Automation" level
  - Add to GitHub: Settings → Secrets → Actions

## 📊 Workflow Status

### Monitoring Release
```bash
# Check GitHub Actions
# → Actions tab → Select workflow → View run

# Check npm registry
npm view huntr-cli version

# Install and verify
npm install -g huntr-cli@latest
huntr --version
```

### Release Timeline Example
```
Mon 2:00 PM  → npm version minor (1.0.0 → 1.1.0)
Mon 2:05 PM  → git push origin main --tags
             ↓ release.yml triggers
Mon 2:15 PM  → GitHub Release created with artifacts
             ↓ publish.yml triggers
Mon 2:20 PM  → npm publish completes
Mon 2:25 PM  ✅ huntr-cli@1.1.0 live on npmjs.com
```

## 🐛 Troubleshooting

### Hooks Not Running
```bash
npm run prepare  # Reinstall hooks
ls -la .husky/   # Verify files exist
```

### Lint Errors on Commit
```bash
npm run lint:fix  # Auto-fix
git add .
git commit -m "..."
```

### Build Failing on Push
```bash
npm run build      # See error details
npm run typecheck  # See type errors
# Fix issues, then retry push
```

### Release Workflow Failed
1. Check GitHub Actions tab
2. Read error message in workflow run
3. Fix issue locally
4. Create new version tag
5. Push to trigger workflow again

## 📞 Support

- **Documentation:** See `docs/` directory
- **Issues:** Use GitHub Issues with labels
- **Discussions:** GitHub Discussions
- **Updates:** Watch releases on npm

## 🎯 Success Criteria

✅ **Local Development**
- Pre-commit hook runs and blocks on errors
- Pre-push hook verifies typecheck, lint, build
- npm run build && npm run lint && npm run typecheck pass

✅ **Testing**
- npm test passes
- All test suites documented
- CI runs tests on every push/PR

✅ **Publishing**
- Version bump creates automatic release
- GitHub Release has artifacts
- npm package published automatically
- Users can `npm install -g huntr-cli@latest`

✅ **Documentation**
- All workflows documented
- Labels sync automatically
- Guides updated with changes
- Man page available: `man huntr`

## 📚 Complete File Index

```
huntr-cli/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    ← Lint, typecheck, build, test
│   │   ├── publish.yml               ← Auto-publish on release
│   │   ├── manual-publish.yml        ← Manual dispatch publish
│   │   ├── release.yml               ← Auto-create releases
│   │   ├── security-audit.yml        ← Daily npm audit
│   │   └── labels.yml                ← Sync labels
│   ├── labels.json                   ← Label definitions
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── config.yml
│   └── pull_request_template.md
├── .husky/
│   ├── pre-commit                    ← Lint staged files
│   └── pre-push                      ← Typecheck, lint, build
├── docs/
│   ├── DEV-SETUP.md
│   ├── CI-CD-SETUP.md
│   ├── AUTOMATIC-PUBLISHING.md
│   ├── TESTING.md
│   ├── ENTITY-TYPES.md
│   ├── OUTPUT-FORMATS.md
│   ├── OUTPUT-EXAMPLES.md
│   └── NPM-PUBLISHING.md
├── tests/
│   └── example.test.ts               ← Test suite (19 cases)
├── src/
│   ├── cli.ts                        ← Main CLI entry
│   ├── commands/                     ← Command handlers
│   ├── api/                          ← API clients
│   ├── config/                       ← Configuration
│   ├── lib/                          ← Utilities
│   └── types/                        ← TypeScript types
├── package.json                      ← Scripts, dependencies
├── eslint.config.js                  ← Linting config
├── .lintstagedrc.json                ← Staged file linting
├── tsconfig.json                     ← TypeScript config
├── CHANGELOG.md                      ← Version history
├── README.md                         ← Project overview
└── WORKFLOW-SUMMARY.md               ← This file
```

---

**Last Updated:** February 23, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
