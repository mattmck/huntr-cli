# Huntr CLI

A command-line interface tool for the [Huntr Organization API](https://docs.huntr.co/). Manage your organization's members, jobs, activities, and tags from the terminal.

## Features

- 🔐 Bearer token authentication
- 📊 List and retrieve members, jobs, activities, and tags
- 📄 JSON and table output formats
- ♾️ Automatic pagination support
- 🎯 Filter jobs and activities by member

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

## Configuration

Create a `.env` file in the project root with your API token:

```bash
cp .env.example .env
```

Edit `.env` and add your token:

```
HUNTR_API_TOKEN=your_token_here
```

Alternatively, you can pass the token directly when using the API programmatically.

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
