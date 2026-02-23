# Huntr CLI

[![CI](https://github.com/mattmck/huntr-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/mattmck/huntr-cli/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/huntr-cli.svg)](https://www.npmjs.com/package/huntr-cli)
[![License: ISC](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

A command-line interface for managing your Huntr job search board. Track activities, search jobs, and manage your application pipeline from the terminal.

## Features

- 🔐 **Session-based auth** — Log in once via browser, CLI auto-refreshes tokens
- 📊 **Multiple output formats** — Table (default), JSON, CSV
- 🔍 **Flexible filtering** — Filter activities by time window and action types
- 🎯 **Your board only** — Personal user API (not organization-scoped)
- 🔒 **Secure storage** — Session data stored in macOS Keychain
- ⚡ **Fast** — No copy-paste token juggling, session persists for weeks

## Installation

### Prerequisites

- Node.js 18 or higher
- macOS with Chrome/Chromium for session capture
- A Huntr account (free at [huntr.co](https://huntr.co))

### Install from npm (recommended)

```bash
npm install -g huntr-cli
# Now use: huntr <command>
```

### Install from source

```bash
git clone https://github.com/mattmck/huntr-cli.git
cd huntr-cli
npm install
npm run build
# Use: huntr <command>
# Or: npm link  (to use 'huntr' command globally)
```

## Quick Start

### 1. Set up session-based authentication

The easiest way — no token copy-paste needed:

```bash
huntr config capture-session
# Automatically extracts your Clerk session from your browser
# Saves to keychain, tests the refresh
```

Verify it works:

```bash
huntr config test-session
```

### 2. List your activities

```bash
huntr activities list <your-board-id> --days 7 --format csv > activities.csv
```

Replace `<your-board-id>` with your actual board ID (you can get it from huntr.co/home in your browser, or run `me` to find it).

## Authentication

The CLI supports multiple auth methods, with this priority order:

1. **CLI argument** (`--token <token>`)
2. **Environment variable** (`HUNTR_API_TOKEN`)
3. **Session-based (macOS only)** — Auto-refreshing browser session
4. **Config file** (`~/.huntr/config.json`)
5. **macOS Keychain** (static token)
6. **Interactive prompt**

### Recommended Method: Session-Based Auth (macOS)

Most convenient for regular use — logs in once via browser, tokens auto-refresh:

```bash
# Extract Clerk session from your browser and save to Keychain
huntr config capture-session

# Verify it works
huntr config test-session

# From now on, all commands auto-refresh tokens before use
huntr activities list <board-id>
```

If capture fails, check Chrome DevTools:

```bash
huntr config check-cdp
```

### Cross-Platform: Environment Variable (All Platforms)

**For non-Mac users or CI/CD environments**, use environment variables or a `.env` file:

Create a `.env` file in your huntr-cli project root:

```bash
# .env
HUNTR_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Then use the CLI:

```bash
huntr activities list <board-id>
```

By default, the CLI does NOT auto-load `.env` to avoid noisy logs. To load it, prefix commands with `HUNTR_LOAD_ENV=true`.

Examples:

```bash
HUNTR_LOAD_ENV=true huntr activities list <board-id>
# or in dev:
HUNTR_LOAD_ENV=true npm run dev -- boards list
```

**Note:** Keep `.env` out of version control (it's already in `.gitignore`).

To get your token, log into Huntr and run in your browser DevTools console:

```javascript
await window.Clerk.session.getToken()
// Copy the output and paste into your .env file
```

### Method: Static API Token (All Platforms)

For one-off use or scripting, save a token to the config file:

```bash
# In DevTools console on huntr.co:
# await window.Clerk.session.getToken()  → copy result

huntr config set-token "<token>"
```

Check your configured sources:

```bash
huntr config show-token
```

Clear tokens:

```bash
huntr config clear-token --all
huntr config clear-session  # Clear saved browser session
```

### Method: Command-Line or Shell Environment

```bash
# Via CLI argument
huntr activities list <board-id> --token <your-jwt>

# Via shell environment variable (one-time)
HUNTR_API_TOKEN=<your-jwt> huntr activities list <board-id>

# Via persistent shell environment
export HUNTR_API_TOKEN=<your-jwt>
huntr activities list <board-id>
```

## Usage

### User Profile

Show your Huntr user info:

```bash
huntr me
huntr me --json
```

### Boards

List your boards:

```bash
huntr boards list
huntr boards list --format json
huntr boards list --format csv
```

Get details for a specific board:

```bash
huntr boards get <board-id>
```

### Jobs

List all jobs on a board:

```bash
huntr jobs list <board-id>
huntr jobs list <board-id> --format csv
```

Get details for a specific job:

```bash
huntr jobs get <board-id> <job-id>
```

### Activities

List activities (job tracking actions you've taken):

```bash
# All activities
huntr activities list <board-id>

# Last 7 days
huntr activities list <board-id> --days 7

# Last 7 days, JSON output
huntr activities list <board-id> --days 7 --format json

# Last 7 days, CSV output (for spreadsheet import)
huntr activities list <board-id> --days 7 --format csv

# Filter by action types
huntr activities list <board-id> --types JOB_MOVED,NOTE_CREATED
```

Export last 7 days as CSV:

```bash
huntr activities week-csv <board-id> > activities.csv
```

### Global Options

- `-t, --token <token>` — Specify API token (overrides all other sources)
- `-h, --help` — Show help for any command

### List Command Options

Available on `boards list`, `jobs list`, and `activities list`:

- `-f, --format <format>` — Output format: `table` (default), `json`, or `csv`
- `-j, --json` — Same as `--format json` (legacy alias)

For `activities list` only:

- `-d, --days <days>` — Filter to last N days (e.g., `--days 7` for past week)
- `-w, --week` — Filter to last 7 days (legacy alias for `--days 7`)
- `--types <types>` — Comma-separated action types (e.g., `JOB_MOVED,NOTE_CREATED`)

## Examples

### Export your last week of activity to a spreadsheet

```bash
huntr activities list 68bf9e33f871e5004a5eb58e --days 7 --format csv > week.csv
```

Then open `week.csv` in Excel or Google Sheets.

### Get JSON of your jobs for scripting

```bash
huntr jobs list <board-id> --json | jq '.[] | {ID, Title}'
```

### Check which auth sources are configured

```bash
huntr config show-token
```

Output:
```
Configured authentication sources:
  Environment variable (HUNTR_API_TOKEN): ✗ Not set
  Clerk session (auto-refresh):           ✓ Set
  Config file (~/.huntr/config.json):     ✗ Not set
  macOS Keychain:                         ✗ Not set

✓ Clerk session active — tokens refresh automatically.
```

## Development

Run in development mode with TypeScript hot-reload:

```bash
npm run dev -- activities list <board-id>
```

Build for production:

```bash
npm run build
```

Run tests (if added):

```bash
npm test
```

## Finding Your Board ID

1. Go to [huntr.co/home](https://huntr.co/home)
2. Open DevTools (F12)
3. Run: `window.location.href` and note the URL
4. Or run: `huntr me --json` to see your boards

## Troubleshooting

### "Session expired or invalid (HTTP 401)"

Your browser session has expired or been revoked. Re-run (macOS only):

```bash
huntr config capture-session
```

**Non-Mac users:** Use the `.env` file method instead (see "Cross-Platform: Environment Variable" above).

### "No Clerk session stored"

You haven't set up session-based auth yet. This is macOS-only. Options:

**On macOS:**
```bash
huntr config capture-session
```

**On other platforms:**
Create a `.env` file with your token:
```bash
echo "HUNTR_API_TOKEN=<your-token>" > .env
```

### "Could not connect to Chrome DevTools Protocol"

Session capture (macOS only) needs Chrome running with remote debugging. Try:

```bash
# Quit all Chrome instances first
killall "Google Chrome"

# Then re-run
huntr config capture-session
# (It will auto-launch Chrome)
```

Or manually launch Chrome with:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 https://huntr.co/home
# Then run: huntr config capture-session
```

### "No token found" on non-Mac platforms

Session-based auth only works on macOS. Use one of these methods instead:

**Option 1: .env file (recommended for single machine)**
```bash
# Create .env in your huntr-cli directory
echo "HUNTR_API_TOKEN=<your-token>" > .env
huntr activities list <board-id>
```

**Option 2: Save to config file (all platforms)**
```bash
huntr config set-token "<your-token>"
huntr activities list <board-id>
```

**Option 3: Shell environment variable**
```bash
export HUNTR_API_TOKEN=<your-token>
huntr activities list <board-id>
```

## License

ISC
