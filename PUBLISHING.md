# Publishing Huntr CLI to npm

This guide covers publishing huntr-cli to npm and how users can install it.

## Prerequisites

1. **npm account**: Create one at [npmjs.com](https://npmjs.com) if you don't have one
2. **Verify git status**: Ensure your working directory is clean
3. **Update version**: Bump `version` in `package.json`
4. **Test build**: Run `npm run build` to verify everything compiles

## Publishing Steps

### 1. Prepare the Release

```bash
# Verify clean working directory
git status

# Build to ensure no errors
npm run build

# Run tests (once tests are added)
npm test
```

### 2. Update Version

Use semantic versioning (major.minor.patch):

```bash
# Patch release (bug fixes): 1.0.0 → 1.0.1
npm version patch

# Minor release (new features): 1.0.0 → 1.1.0
npm version minor

# Major release (breaking changes): 1.0.0 → 2.0.0
npm version major
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag

### 3. Push to GitHub

```bash
# Push commits and tags
git push origin main --follow-tags
```

### 4. Publish to npm

```bash
# Login to npm (one-time)
npm login

# Publish
npm publish

# Verify it's published
npm view huntr-cli
```

### 5. Create GitHub Release (Optional)

```bash
# Create a release from the git tag
gh release create v1.0.0 --generate-notes
```

---

## Installation for Users

### Global Installation (Recommended)

```bash
npm install -g huntr-cli

# Verify installation
huntr --help
```

### Local Installation

```bash
npm install huntr-cli
npx huntr --help
```

### From GitHub (Development)

```bash
# Clone repo
git clone https://github.com/mattmck/huntr-cli.git
cd huntr-cli

# Install and link
npm install
npm link

# Now 'huntr' command is available globally
huntr --help
```

---

## Shell Completions

After global installation, users can enable shell completions:

### Bash

```bash
sudo cp completions/huntr.bash /usr/local/etc/bash_completion.d/huntr
source ~/.bashrc
```

### Zsh

```bash
sudo cp completions/_huntr /usr/local/share/zsh/site-functions/_huntr
source ~/.zshrc
```

### Fish

```bash
cp completions/huntr.fish ~/.config/fish/completions/
```

---

## Troubleshooting

### Not published to npm

```bash
# Check if already published
npm view huntr-cli

# Check your npm access
npm access
```

### Version conflicts

```bash
# Check what's already on npm
npm info huntr-cli versions

# You must use a higher version number to republish
```

### Authentication issues

```bash
# Re-login to npm
npm logout
npm login
```

---

## Version History

Track versions and changes:

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0   | 2026-02-22 | Initial release with session-based auth, list commands, CSV/JSON output |

---

## Distribution Checklist

Before publishing a new version:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` (create if missing)
- [ ] Run `npm run build` successfully
- [ ] Run tests (when available)
- [ ] Update README if needed
- [ ] Test completions locally
- [ ] Push to GitHub
- [ ] Run `npm publish`
- [ ] Verify on npmjs.com
- [ ] Create GitHub release
