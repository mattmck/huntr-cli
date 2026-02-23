# Testing Guide

Guide to testing huntr-cli following the development workflow.

## Overview

Tests use **Vitest** (Vite-native test framework) and document the complete huntr-cli workflow:
- Git workflow (conventional commits, hooks)
- Publishing workflow (automatic releases)
- Output formatting features
- Command structure

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suite
```bash
npm test -- --testNamePattern="Publishing"
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Structure

### tests/example.test.ts

Documents the complete workflow:

| Section | Purpose |
|---------|---------|
| **Command Structure** | Verifies CLI commands and output formats |
| **Build & Compilation** | TypeScript and ESLint pass in CI |
| **Git Workflow** | Conventional commits and git hooks |
| **Publishing Workflow** | Automatic npm publishing and versioning |
| **Output Formatting** | Field selection and export formats |
| **Documentation** | Guides and man pages exist |

## Workflow Verification

### ✅ Local Development
```bash
# 1. Create feature branch
git checkout -b feat/my-feature

# 2. Make changes
npm run lint:fix
npm run build

# 3. Commit (pre-commit hook runs)
git commit -m "feat: add feature"

# 4. Push (pre-push hook runs: typecheck → lint → build)
git push origin feat/my-feature
```

### ✅ Pull Request
- Create PR on GitHub
- CI runs automatically (lint, typecheck, build, test)
- All checks must pass
- Code review and approval

### ✅ Publishing
```bash
# 1. Bump version
git checkout main
npm version minor  # Creates commit + tag

# 2. Push with tags
git push origin main --tags

# 3. Release created automatically
# - release.yml creates GitHub Release with artifacts
# - publish.yml triggers on release
# - npm package published automatically
```

### ✅ Version Verification
```bash
# Check npm registry
npm view huntr-cli version

# Install latest
npm install -g huntr-cli@latest

# Verify
huntr --version
```

## Test Examples

### Example: Command Structure
```typescript
it('should support boards list command', () => {
  const commands = ['boards', 'jobs', 'activities'];
  expect(commands).toContain('boards');
});
```

### Example: Publishing Workflow
```typescript
it('should create artifacts on version bump', () => {
  // release.yml detects version change
  // Creates tar.gz and zip archives
  // Creates GitHub Release with artifacts
  expect(true).toBe(true);
});
```

### Example: Git Workflow
```typescript
it('should trigger pre-push hook on git push', () => {
  // Pre-push hook runs: typecheck → lint → build
  expect(true).toBe(true);
});
```

## CI Test Execution

GitHub Actions runs tests automatically:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm test
```

Tests verify:
- Command structure is correct
- All output formats available
- Publishing workflow documented
- Git workflow enforced
- Documentation complete

## Writing New Tests

When adding features, add tests to `tests/example.test.ts`:

```typescript
describe('New Feature', () => {
  it('should do something', () => {
    const result = newFeature();
    expect(result).toBe(true);
  });
});
```

Test structure:
- **Describe:** Feature or workflow area
- **It:** Specific behavior or requirement
- **Expect:** Assertion of correct behavior

## Continuous Integration

### On Every Push
```
→ Pre-commit hook (lint)
→ Pre-push hook (typecheck, lint, build)
→ GitHub Actions CI (lint, typecheck, build, test)
```

### On Pull Request
```
→ Same CI checks
→ Code review required
→ Tests must pass
```

### On Main Branch Push
```
→ All CI checks pass
→ Version bump triggers release.yml
→ GitHub Release created with artifacts
→ npm publishing triggered
```

## Troubleshooting

### Tests Failing
```bash
# Run with verbose output
npm test -- --reporter=verbose

# Check test names
npm test -- --listTests
```

### Missing Dependencies
```bash
npm install
npm run build:shared  # For workspace tests
```

### ESLint/Typecheck Failing
```bash
npm run lint:fix
npm run typecheck
```

## See Also

- [DEV-SETUP.md](./DEV-SETUP.md) — Development workflow
- [CI-CD-SETUP.md](./CI-CD-SETUP.md) — Hook configuration
- [AUTOMATIC-PUBLISHING.md](./AUTOMATIC-PUBLISHING.md) — Publishing workflow
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) — CI configuration
