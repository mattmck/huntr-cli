# NPM Publishing Guide

When you publish huntr-cli to npm, here's where it lives and how users install it.

## Where Your Package Lives

### npm Registry (npmjs.com)

When you run `npm publish`, your package is uploaded to the **npm registry** at:

```
https://www.npmjs.com/package/huntr-cli
```

This is the **official public npm registry** operated by GitHub (acquired by GitHub in 2020). Every time you publish a new version, it's stored here and immediately available to the world.

### Local npm Cache

When a user installs your package with `npm install -g huntr-cli`:
1. npm checks their local cache first (`~/.npm`)
2. If not cached, downloads from npmjs.com
3. Stores a local copy in their cache

### Global Installation Location

When installed globally (`-g` flag), the executable is placed in the user's global node_modules:

**macOS/Linux:**
```bash
~/.nvm/versions/node/v18.x.x/bin/huntr
# OR
/usr/local/bin/huntr
# OR
~/.npm/_npx/huntr-cli/bin/huntr
```

**Windows:**
```
C:\Users\username\AppData\Roaming\npm\huntr.cmd
C:\Users\username\AppData\Roaming\npm\huntr
```

The `bin` field in your `package.json` tells npm where to create this symlink:

```json
{
  "name": "huntr-cli",
  "bin": {
    "huntr": "./dist/cli.js"
  }
}
```

## How to Publish

### 1. Create npm Account

If you don't have one:
```bash
npm adduser
# Enter username, password, email
```

Verify you're logged in:
```bash
npm whoami
```

### 2. Update Version in package.json

Update the version following semver (major.minor.patch):

```bash
# Manual update
"version": "1.0.0" → "1.0.1"

# OR use npm version command
npm version patch    # 1.0.0 → 1.0.1
npm version minor    # 1.0.0 → 1.1.0
npm version major    # 1.0.0 → 2.0.0
```

### 3. Build the Project

The `prepublishOnly` script runs automatically before publishing:

```json
{
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

So just publish:
```bash
npm publish
```

It automatically builds to `dist/` before uploading.

### 4. Verify Publishing

Check that your package is live:

```bash
# View on npm
npm view huntr-cli

# Check latest version
npm view huntr-cli version

# View all versions
npm view huntr-cli versions

# Open in browser
npm view huntr-cli repository.url
```

Or visit: https://www.npmjs.com/package/huntr-cli

## After Publishing

### Users Can Install Globally

```bash
npm install -g huntr-cli
huntr --version
huntr boards list
```

### Users Can Use with npx (No Installation)

```bash
npx huntr-cli me
npx huntr-cli boards list
npx huntr-cli jobs list <board-id>
```

This runs the latest version without installing it globally.

### Distribute Shell Completions

For users who want bash/zsh completions, they can download from your GitHub repo:

```bash
# User's setup:
cd huntr-cli
cp completions/huntr.bash ~/.bash_completion.d/huntr
# or
cp completions/_huntr ~/.zsh/completions/_huntr
```

Or you could add a `postinstall` script to automatically copy completions (optional):

```json
{
  "scripts": {
    "postinstall": "node scripts/install-completions.js"
  }
}
```

## About GitHub Artifacts

You mentioned GitHub artifacts. These are **different from npm publishing**:

### GitHub Artifacts
- **Where:** GitHub Actions artifact storage (temporary)
- **What:** Build outputs (dist/, coverage/, etc.)
- **Lifetime:** Default 90 days, configurable
- **Access:** Only in the workflow or via GitHub API
- **Use case:** CI/CD testing, not distribution

### npm Registry
- **Where:** npmjs.com (permanent)
- **What:** Your published package
- **Lifetime:** Forever (unless you unpublish)
- **Access:** `npm install`, searchable on npmjs.com
- **Use case:** Public distribution

**GitHub Artifacts are NOT for distributing CLI tools to users.** npm is the standard for Node.js packages.

## Distribution Flow

```
GitHub Repo
    ↓
    └─→ [npm publish] → npmjs.com ← [npm install -g] ← Users
    └─→ GitHub Actions → GitHub Artifacts (temporary, CI only)
```

## Optional: GitHub Releases

You can also create **GitHub Releases** with prebuilt binaries:

```bash
# Create a release
gh release create v1.0.0 --title "Version 1.0.0"

# Upload artifacts to release
gh release upload v1.0.0 ./dist/huntr-cli.tar.gz
```

Users could then download from: https://github.com/mattmck/huntr-cli/releases

But for Node.js CLIs, npm is the standard distribution method.

## Version Management

### Semantic Versioning

- **1.0.0** = major.minor.patch
- **1.0.1** = patch release (bug fix)
- **1.1.0** = minor release (new feature, backward compatible)
- **2.0.0** = major release (breaking change)

### Current Version

Your current version is `1.0.0` in package.json.

Next versions:
- Adding --fields, PDF, Excel = **1.1.0** (new features, backward compatible)
- Bug fixes = **1.0.1**
- Breaking change (e.g., rename command) = **2.0.0**

### Prerelease Versions

You can also publish prerelease versions:
```bash
npm version prerelease  # 1.0.0 → 1.0.1-0
npm publish --tag beta
```

Users can then install:
```bash
npm install -g huntr-cli@beta
```

## Checklist Before Publishing

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md (if you have one)
- [ ] Run `npm run build` — ensure it compiles
- [ ] Run `npm run lint` — no linting errors
- [ ] Run `npm test` (if you have tests)
- [ ] Update README.md if needed
- [ ] Commit changes: `git commit -m "chore: v1.0.1"`
- [ ] Tag release: `git tag v1.0.1`
- [ ] Push to GitHub: `git push origin main --tags`
- [ ] Publish to npm: `npm publish`
- [ ] Verify on npmjs.com

## Unpublishing (if needed)

If you accidentally publish something broken, you can unpublish:

```bash
# Unpublish a specific version
npm unpublish huntr-cli@1.0.0

# Unpublish entire package (only works within 24 hours)
npm unpublish huntr-cli --force
```

This is a last resort and not recommended. Better to publish a patch fix.

## Keeping npm Secure

- **Never commit `.npmrc`** — add to `.gitignore`
- **Use automation tokens** if publishing from CI/CD
- **Scope your package** if you want `npm install @mattmcknight/huntr-cli` (requires pro account)
- **Enable 2FA** on your npm account: `npm profile set-2fa auth-and-writes`

## Troubleshooting

### "You must be logged in to publish"

```bash
npm login
npm whoami  # verify
```

### "Package name already taken"

Your package.json name is used as-is. If `huntr-cli` is taken, you could use:
```json
{
  "name": "@mattmcknight/huntr-cli",
  "name": "huntr-cli-mcknight"
}
```

### "build script not running"

Make sure `prepublishOnly` is in package.json scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

### "dist/ not uploading"

Check that `dist/` is NOT in `.npmignore`:
```bash
cat .npmignore  # should NOT list dist/
```

If `.npmignore` exists and lists dist/, remove that line.

## Summary

**After publishing to npm:**
- Users run: `npm install -g huntr-cli`
- Package lives at: https://npmjs.com/package/huntr-cli
- Can be used globally: `huntr boards list`
- Can be used with npx: `npx huntr-cli boards list`
- GitHub Artifacts are for CI/CD, not distribution
- npm Registry is the official distribution channel
