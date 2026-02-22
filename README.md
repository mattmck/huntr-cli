# Huntr CLI

A command-line interface tool for the [Huntr Organization API](https://docs.huntr.co/). Manage your organization's members, jobs, activities, and tags from the terminal.

## Features

- 🔐 Multiple authentication methods (CLI arg, env var, config file, keychain, prompt)
- 📊 List and retrieve members, jobs, activities, and tags
- 📄 JSON and table output formats
- ♾️ Automatic pagination support
- 🎯 Filter jobs and activities by member
- 🔒 Secure token storage via macOS Keychain

## Installation

### Prerequisites

- Node.js 18 or higher
- A Huntr Organization account with API access
- A Huntr API token ([get one from your organization's admin dashboard](https://huntr.co))

### Install from source

```bash
git clone https://github.com/mattmck/huntr-cli.git
cd huntr-cli
npm install
npm run build
npm link
```

## Authentication

The CLI supports multiple ways to provide your API token, with the following priority order:

1. **Command-line argument** (highest priority)
2. **Environment variable**
3. **Config file** (`~/.huntr/config.json`)
4. **macOS Keychain**
5. **Interactive prompt** (lowest priority)

### Method 1: Command-line Argument

Pass the token directly with any command:

```bash
huntr members list --token your_token_here
```

### Method 2: Environment Variable

Set the `HUNTR_API_TOKEN` environment variable:

```bash
export HUNTR_API_TOKEN=your_token_here
huntr members list
```

Or use a `.env` file in the project directory:

```bash
cp .env.example .env
# Edit .env and add: HUNTR_API_TOKEN=your_token_here
```

### Method 3: Config File

Save your token to `~/.huntr/config.json`:

```bash
huntr config set-token your_token_here
```

This is convenient for persistent storage without environment variables.

### Method 4: macOS Keychain (Most Secure)

Save your token securely to macOS Keychain:

```bash
huntr config set-token --keychain your_token_here
```

The token will be encrypted and stored securely in your system keychain.

### Method 5: Interactive Prompt

If no token is found, the CLI will prompt you to enter it:

```bash
huntr members list
# You'll be prompted to enter your token and choose where to save it
```

### Managing Your Token

Check which token sources are configured:

```bash
huntr config show-token
```

Clear saved tokens:

```bash
# Clear from all locations
huntr config clear-token

# Clear from specific location
huntr config clear-token --config
huntr config clear-token --keychain
```

## Usage

### Members

List all organization members:

```bash
huntr members list
```

List all members with pagination (fetch all pages):

```bash
huntr members list --all
```

Get specific member details:

```bash
huntr members get <member-id>
```

Output as JSON:

```bash
huntr members list --json
```

### Jobs

List all jobs:

```bash
huntr jobs list
```

List jobs for a specific member:

```bash
huntr jobs list --member-id <member-id>
```

Get specific job details:

```bash
huntr jobs get <job-id>
```

Fetch all jobs across all pages:

```bash
huntr jobs list --all
```

### Activities

List all activities:

```bash
huntr activities list
```

List activities for a specific member:

```bash
huntr activities list --member-id <member-id>
```

### Tags

List all tags:

```bash
huntr tags list
```

Create a new tag:

```bash
huntr tags create "My Tag"
```

Create a tag with a target object:

```bash
huntr tags create "Interview Prep" --target job
```

### Global Options

- `-t, --token <token>` - API token (overrides all other sources)
- `-j, --json` - Output results as JSON
- `-a, --all` - Fetch all pages (for paginated results)
- `-l, --limit <number>` - Number of results per page (default: 100)

## Development

Run in development mode:

```bash
npm run dev -- members list
```

Build the project:

```bash
npm run build
```

## API Documentation

For full API documentation, visit [https://docs.huntr.co/](https://docs.huntr.co/)

## License

ISC
