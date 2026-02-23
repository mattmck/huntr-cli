# huntr-cli Agent Instructions

Agent context and best practices for working on the huntr-cli project.

## Project Overview

**huntr-cli** is a production-ready CLI tool for managing your Huntr job search board. It features:
- Complete API client for Huntr Personal API
- Multiple output formats (table, JSON, CSV, PDF, Excel)
- Field selection with `--fields` parameter
- Session-based and token-based authentication
- Full CI/CD pipeline with automatic publishing
- Comprehensive test suite and documentation

**Status:** ✅ Production ready (v1.0.0)
**License:** ISC (open source)
**Language:** TypeScript (strict mode)

## Architecture

```
huntr-cli/
├── src/
│   ├── cli.ts              ← Main entry point
│   ├── commands/           ← Command handlers
│   ├── api/personal/       ← API client (boards, jobs, activities, users)
│   ├── config/             ← Token management, session capture
│   ├── lib/                ← Utilities (formatting, validation)
│   └── types/personal.ts   ← TypeScript interfaces
├── dist/                   ← Compiled output (git ignored)
├── tests/                  ← Vitest test suite
├── docs/                   ← Comprehensive guides
├── .github/
│   ├── workflows/          ← 6 GitHub Actions workflows
│   ├── ISSUE_TEMPLATE/     ← Issue templates
│   └── labels.json         ← GitHub labels
├── .husky/                 ← Git hooks (pre-commit, pre-push)
└── package.json            ← Scripts and dependencies
```

## Key Files

| File | Purpose |
|------|---------|
| `src/cli.ts` | Main CLI entry, command registration |
| `src/api/personal/index.ts` | API client exports |
| `src/lib/list-options.ts` | Output formatting and field selection |
| `src/config/token-manager.ts` | Token/session management |
| `.github/workflows/release.yml` | Automatic release creation |
| `.github/workflows/publish.yml` | npm publishing |
| `docs/WORKFLOW-SUMMARY.md` | Complete workflow reference |
| `package.json` | All scripts and dependencies |

## Development Setup

### Installation
```bash
npm install  # Automatically installs git hooks via husky
```

### Available Commands
```bash
npm run dev -- <command>       # Run CLI in dev mode
npm run build                  # Compile TypeScript
npm run lint                   # Check code style
npm run lint:fix               # Auto-fix style issues
npm run typecheck              # Check TypeScript types
npm test                       # Run test suite
npm run test:watch             # Watch mode for tests
npm run prepare                # Reinstall git hooks
```

### Git Workflow

**Create feature:**
```bash
git checkout -b feat/my-feature
```

**Develop:**
```bash
npm run dev -- boards list     # Test changes
npm run lint:fix               # Fix style
npm run build                  # Build
npm run typecheck              # Type check
```

**Commit (pre-commit hook runs):**
```bash
git commit -m "feat: add feature"  # Lints staged files
```

**Push (pre-push hook runs):**
```bash
git push origin feat/my-feature    # Typecheck → Lint → Build
```

**Create PR → Code review → Merge to main**

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:  New feature (appears in changelog)
fix:   Bug fix (appears in changelog)
perf:  Performance improvement (appears in changelog)
docs:  Documentation only
chore: Build, dependencies, tooling (internal)
test:  Test improvements (internal)
refactor: Code restructuring (internal)
ci:    CI/CD changes (internal)
```

**Examples:**
```bash
git commit -m "feat: add --fields parameter for field selection"
git commit -m "fix: handle missing company in activities"
git commit -m "perf: optimize table rendering"
git commit -m "chore: update dependencies"
```

## Code Standards

### TypeScript
- **Strict mode enabled** — No implicit `any`
- **ESLint with TypeScript support** — Modern flat config
- **Import style** — ES modules (`import`/`export`)
- **No `console.log` in production** — Use proper logging

### Formatting
- **Quotes:** Single quotes (`'`) preferred
- **Semicolons:** Always required
- **Trailing commas:** Always on multiline
- **Line length:** No hard limit, but keep readable
- **Auto-fixed by:** `npm run lint:fix`

### Patterns

**API Client Pattern:**
```typescript
// src/api/personal/my-feature.ts
export async function getMyFeature(token: string): Promise<MyData[]> {
  const response = await fetch('https://api.huntr.co/...');
  return response.json();
}

// Re-export from index.ts
```

**Command Pattern:**
```typescript
// In src/cli.ts
program
  .command('my-command <id>')
  .option('--format <format>', 'Output format')
  .option('--fields <fields>', 'Field selection')
  .action(async (id, options) => {
    // Implementation
  });
```

**Output Formatting:**
```typescript
// Use validateFields and format functions from src/lib/list-options.ts
const fields = validateFields(requested, availableFields);
const output = formatTableWithFields(data, fields);
```

## Testing

### Running Tests
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage  # Coverage report
```

### Test Structure
- **Command Structure** — Verify CLI commands exist
- **Build & Compilation** — Document CI checks
- **Git Workflow** — Verify conventional commits
- **Publishing Workflow** — Document release process
- **Output Formatting** — Verify formats (table, JSON, CSV, PDF, Excel)
- **Documentation** — Confirm guides exist

### Adding Tests
Edit `tests/example.test.ts`:
```typescript
describe('Feature Area', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

## Git Hooks

### Pre-commit Hook
**File:** `.husky/pre-commit`
- Runs on: `git commit`
- Actions: Lints staged files, auto-fixes, blocks on errors
- Config: `.lintstagedrc.json`

### Pre-push Hook
**File:** `.husky/pre-push`
- Runs on: `git push`
- Actions: Typecheck → Lint → Build
- Blocks: If any check fails

**Bypass (emergency only):**
```bash
git push --no-verify  # Not recommended!
```

## GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **ci.yml** | Every push + PR | Lint, typecheck, build, test (parallel) |
| **release.yml** | Version bump on main | Create artifacts + GitHub Release |
| **publish.yml** | GitHub Release published | npm publish |
| **manual-publish.yml** | Manual dispatch | Custom version + npm tag |
| **security-audit.yml** | Daily + push | npm audit vulnerability scan |
| **labels.yml** | labels.json change | Sync GitHub labels |

**File location:** `.github/workflows/`

## Publishing & Releases

### Automatic Publishing (Recommended)
```bash
npm version minor          # 1.0.0 → 1.1.0
git push origin main --tags
# → release.yml creates artifacts + GitHub Release
# → publish.yml publishes to npm
```

### Manual Publishing
GitHub Actions → Manual Publish → Run workflow with version + npm tag

### Changelog Generation
- **Format:** Keep a Changelog
- **Auto-generated:** From conventional commits
- **File:** `CHANGELOG.md`
- **Guide:** `docs/CHANGELOG-AUTOMATION.md`

## Types & Interfaces

**Key types in `src/types/personal.ts`:**

```typescript
export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lists: BoardList[];
}

export interface PersonalJob {
  id: string;
  title: string;
  url?: string;
  salary?: Salary;
  location?: Location;
  // ... more fields
}

export interface PersonalAction {
  id: string;
  actionType: string;
  date: string;
  data: ActionData;
}
```

**Full reference:** `docs/ENTITY-TYPES.md`

## Output Formatting

**Supported formats:**
- `table` — Human-readable (default)
- `json` — Machine-readable
- `csv` — Spreadsheet import
- `pdf` — Document export (pdfkit)
- `excel` — Spreadsheet (.xlsx, exceljs)

**Field selection:**
```bash
huntr boards list --fields ID,Name
huntr jobs list <board-id> --fields Title,URL --format csv
```

**Implementation:** `src/lib/list-options.ts`

## Authentication

**Supported methods (priority order):**
1. CLI argument: `--token <token>`
2. Environment variable: `HUNTR_API_TOKEN`
3. Session-based: macOS Keychain (auto-refreshing)
4. Config file: `~/.huntr/config.json`
5. Interactive prompt

**Session management:** `src/config/clerk-session-manager.ts`
**Token management:** `src/config/token-manager.ts`

## Documentation

**Quick references:**
- `WORKFLOW-SUMMARY.md` — Complete workflow overview
- `DEV-SETUP.md` — Local development guide
- `AUTOMATIC-PUBLISHING.md` — Release workflow
- `CHANGELOG-AUTOMATION.md` — Changelog generation
- `TESTING.md` — Test suite guide
- `ENTITY-TYPES.md` — Type schemas with examples
- `OUTPUT-FORMATS.md` — Field reference
- `OUTPUT-EXAMPLES.md` — 30+ usage examples

**All docs:** `docs/` directory

## Common Tasks

### Add a New Command
1. Create handler in `src/commands/`
2. Register in `src/cli.ts` with `program.command()`
3. Update `completions/huntr.1` man page
4. Add tests to `tests/example.test.ts`
5. Commit with `feat: add new command`

### Add Output Format
1. Add formatter function to `src/lib/list-options.ts`
2. Update list commands in `src/cli.ts`
3. Test with `npm run dev -- <command> --format <format>`
4. Commit with `feat: add <format> export`

### Fix a Bug
1. Create branch: `git checkout -b fix/bug-description`
2. Fix issue
3. Add test case
4. Verify: `npm run build && npm run lint && npm run typecheck && npm test`
5. Commit: `fix: resolve bug description`
6. Create PR

### Update Documentation
1. Edit relevant `.md` file
2. Test commands if documenting features
3. Commit: `docs: update documentation`

## Troubleshooting

### Pre-commit Hook Failing
```bash
npm run lint:fix  # Auto-fix issues
git add .
git commit -m "..."
```

### Pre-push Hook Failing
```bash
npm run typecheck  # See type errors
npm run build      # See build errors
# Fix issues, retry push
```

### Hooks Not Running
```bash
npm run prepare  # Reinstall hooks
ls -la .husky/   # Verify files exist
```

### Tests Failing
```bash
npm test -- --reporter=verbose  # Verbose output
npm test -- --watch             # Watch mode
```

## Best Practices

✅ **DO**
- Write conventional commit messages
- Use TypeScript strict mode
- Run `npm run lint:fix` before committing
- Write tests for new features
- Update documentation when making changes
- Review GitHub Actions logs if workflows fail

❌ **DON'T**
- Use `any` type without good reason
- Bypass pre-commit/pre-push hooks regularly
- Mix internal and user-facing changes in one commit
- Commit without running `npm run build`
- Push to main without PR review
- Force push to main branch

## Performance Considerations

- **List commands:** Use field selection to reduce output
- **API calls:** Cache responses when appropriate
- **Formatting:** Lazy-load PDF/Excel formatters
- **Colors:** Keep table formatting efficient

## Security

- **Environment variables:** Use `HUNTR_API_TOKEN` instead of flags
- **Session storage:** macOS Keychain for local sessions
- **Token validation:** JWT-based via Clerk
- **No sensitive data in logs:** Use `DEBUG=huntr-cli:*`

## Resources

- **Huntr API:** https://huntr.co
- **GitHub:** https://github.com/mattmck/huntr-cli
- **npm:** https://www.npmjs.com/package/huntr-cli
- **Issues:** GitHub Issues with type/priority/scope labels
- **Discussions:** GitHub Discussions

## Agent-Specific Notes

### Claude Code / Cursor
- Full TypeScript support with strict mode
- ESLint auto-fixes available
- Test suite documents workflow
- All workflows in `.github/workflows/`

### GitHub Copilot
- Follows conventional commits
- Clear function signatures
- Comprehensive test examples
- API patterns well-documented

### Anthropic Claude
- Project has complete documentation
- Architecture clearly separated
- Types are explicit and strict
- Testing approach is documented

## Version Info

- **Current Version:** 1.0.0
- **Node.js Required:** >=18.0.0
- **TypeScript:** 5.9.3
- **Status:** ✅ Production ready
- **Last Updated:** February 23, 2026

---

**For detailed information, see the documentation in the `docs/` directory.**
