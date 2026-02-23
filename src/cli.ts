#!/usr/bin/env node

import { Command, InvalidArgumentError } from 'commander';
import { HuntrPersonalApi } from './api/personal';
import { TokenManager } from './config/token-manager';
import { ClerkSessionManager } from './config/clerk-session-manager';
import { captureSession, checkCdpSession } from './commands/capture-session';

const program = new Command();
const tokenManager = new TokenManager();

type OutputFormat = 'json' | 'table' | 'csv';

type SharedListOptions = {
  format?: OutputFormat;
  json?: boolean;
  days?: number;
  since?: Date;
  until?: Date;
  limit?: number;
  week?: boolean;
};

function parsePositiveInt(value: string, flagName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`${flagName} must be a positive integer.`);
  }
  return parsed;
}

function parseDaysOption(value: string): number {
  return parsePositiveInt(value, '--days');
}

function parseLimitOption(value: string): number {
  return parsePositiveInt(value, '--limit');
}

function parseFormatOption(value: string): OutputFormat {
  const normalized = value.toLowerCase();
  if (normalized === 'json' || normalized === 'table' || normalized === 'csv') {
    return normalized;
  }
  throw new InvalidArgumentError('--format must be one of: json, table, csv.');
}

function parseDateOption(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InvalidArgumentError('Date must be in YYYY-MM-DD format.');
  }

  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new InvalidArgumentError(`Invalid calendar date: ${value}`);
  }

  return date;
}

function resolveOutputFormat(options: SharedListOptions): OutputFormat {
  if (options.json) {
    if (options.format && options.format !== 'json') {
      throw new Error(`--json cannot be combined with --format ${options.format}.`);
    }
    return 'json';
  }
  return options.format ?? 'json';
}

function resolveDateRange(options: SharedListOptions): { since?: Date; until?: Date } {
  let days = options.days;
  if (options.week) {
    if (options.days || options.since || options.until) {
      throw new Error('--week cannot be combined with --days, --since, or --until.');
    }
    days = 7;
  }

  if (days && (options.since || options.until)) {
    throw new Error('--days cannot be combined with --since or --until.');
  }

  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : options.since;
  const until = options.until
    ? new Date(Date.UTC(
      options.until.getUTCFullYear(),
      options.until.getUTCMonth(),
      options.until.getUTCDate(),
      23, 59, 59, 999,
    ))
    : undefined;

  if (since && until && since.getTime() > until.getTime()) {
    throw new Error('--since must be earlier than or equal to --until.');
  }

  return { since, until };
}

function filterByDateRange<T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  range: { since?: Date; until?: Date },
): T[] {
  return items.filter(item => {
    const raw = getDate(item);
    if (!raw) return true;

    const timestamp = new Date(raw).getTime();
    if (Number.isNaN(timestamp)) return false;
    if (range.since && timestamp < range.since.getTime()) return false;
    if (range.until && timestamp > range.until.getTime()) return false;
    return true;
  });
}

function applyLimit<T>(items: T[], limit?: number): T[] {
  if (!limit) return items;
  return items.slice(0, limit);
}

function csvCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function printCsv(headers: string[], rows: unknown[][]): void {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','));
  }
  console.log(lines.join('\n'));
}

async function getApi(token?: string): Promise<HuntrPersonalApi> {
  const provider = await tokenManager.getTokenProvider({ token });
  return new HuntrPersonalApi(provider);
}

program
  .name('huntr')
  .description('CLI tool for Huntr')
  .version('1.1.0')
  .option('-t, --token <token>', 'API token (overrides all other sources)');

// ── me ───────────────────────────────────────────────────────────────────────

program
  .command('me')
  .description('Show your user profile')
  .option('-j, --json', 'Output as JSON')
  .action(async (options, command) => {
    try {
      const api = await getApi(command.parent?.opts().token);
      const profile = await api.user.getProfile();
      if (options.json) {
        console.log(JSON.stringify(profile, null, 2));
      } else {
        console.log(`Name: ${profile.givenName ?? profile.firstName ?? ''} ${profile.familyName ?? profile.lastName ?? ''}`);
        console.log(`Email: ${profile.email}`);
        console.log(`ID: ${profile.id}`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ── boards ───────────────────────────────────────────────────────────────────

const boards = program.command('boards').description('Manage your boards');

boards
  .command('list')
  .description('List all your boards')
  .option('-f, --format <format>', 'Output format: json | table | csv', parseFormatOption, 'json')
  .option('-j, --json', 'Output as JSON (alias for --format json)')
  .option('-d, --days <n>', 'Show only boards created in last N days', parseDaysOption)
  .option('--since <date>', 'Show boards created since YYYY-MM-DD', parseDateOption)
  .option('--until <date>', 'Show boards created until YYYY-MM-DD (inclusive)', parseDateOption)
  .option('--limit <n>', 'Maximum rows to output', parseLimitOption)
  .action(async (options, command) => {
    try {
      const format = resolveOutputFormat(options);
      const range = resolveDateRange(options);

      const api = await getApi(command.parent?.parent?.opts().token);
      const response = await api.boards.list();
      const boardsList = Array.isArray(response) ? response : (response as any).data ?? [];
      const sorted = [...boardsList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const filtered = applyLimit(filterByDateRange(sorted, b => b.createdAt, range), options.limit);

      if (format === 'json') {
        console.log(JSON.stringify(filtered, null, 2));
      } else if (filtered.length === 0) {
        console.log('No boards found.');
      } else if (format === 'csv') {
        printCsv(
          ['id', 'name', 'created_at'],
          filtered.map((b: any) => [b.id, b.name ?? '', b.createdAt ?? '']),
        );
      } else {
        console.table(filtered.map((b: any) => ({
          ID: b.id,
          Name: b.name ?? 'N/A',
          Created: new Date(b.createdAt).toLocaleDateString(),
        })));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

boards
  .command('get')
  .description('Get details of a specific board')
  .argument('<board-id>', 'Board ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (boardId, options, command) => {
    try {
      const api = await getApi(command.parent?.parent?.opts().token);
      const board = await api.boards.get(boardId);
      if (options.json) {
        console.log(JSON.stringify(board, null, 2));
      } else {
        console.log(`Board: ${board.name}`);
        console.log(`ID: ${board.id}`);
        console.log(`Created: ${new Date(board.createdAt).toLocaleString()}`);
        if (board.lists?.length) {
          console.log('\nLists:');
          board.lists.forEach(l => console.log(`  - ${l.name}`));
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ── jobs ─────────────────────────────────────────────────────────────────────

const jobs = program.command('jobs').description('Manage jobs on your boards');

jobs
  .command('list')
  .description('List jobs on a board')
  .argument('<board-id>', 'Board ID')
  .option('-f, --format <format>', 'Output format: json | table | csv', parseFormatOption, 'json')
  .option('-j, --json', 'Output as JSON (alias for --format json)')
  .option('-d, --days <n>', 'Show only jobs created in last N days', parseDaysOption)
  .option('--since <date>', 'Show jobs created since YYYY-MM-DD', parseDateOption)
  .option('--until <date>', 'Show jobs created until YYYY-MM-DD (inclusive)', parseDateOption)
  .option('--limit <n>', 'Maximum rows to output', parseLimitOption)
  .action(async (boardId, options, command) => {
    try {
      const format = resolveOutputFormat(options);
      const range = resolveDateRange(options);

      const api = await getApi(command.parent?.parent?.opts().token);
      const jobsList = await api.jobs.listByBoardFlat(boardId);
      const sorted = [...jobsList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const filtered = applyLimit(filterByDateRange(sorted, j => j.createdAt, range), options.limit);

      if (format === 'json') {
        console.log(JSON.stringify(filtered, null, 2));
      } else if (filtered.length === 0) {
        console.log('No jobs found.');
      } else if (format === 'csv') {
        printCsv(
          ['id', 'title', 'url', 'created_at'],
          filtered.map(j => [j.id, j.title, j.url ?? '', j.createdAt]),
        );
      } else {
        console.table(filtered.map(j => ({
          ID: j.id,
          Title: j.title,
          URL: j.url ?? 'N/A',
          Created: new Date(j.createdAt).toLocaleDateString(),
        })));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

jobs
  .command('get')
  .description('Get details of a specific job')
  .argument('<board-id>', 'Board ID')
  .argument('<job-id>', 'Job ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (boardId, jobId, options, command) => {
    try {
      const api = await getApi(command.parent?.parent?.opts().token);
      const job = await api.jobs.get(boardId, jobId);
      if (options.json) {
        console.log(JSON.stringify(job, null, 2));
      } else {
        console.log('\nJob Details:');
        console.log(`  Title:    ${job.title}`);
        console.log(`  URL:      ${job.url ?? 'N/A'}`);
        console.log(`  Location: ${job.location?.address ?? 'N/A'}`);
        if (job.salary) {
          console.log(`  Salary:   ${job.salary.min ?? 'N/A'} - ${job.salary.max ?? 'N/A'} ${job.salary.currency ?? ''}`);
        }
        console.log(`  Created:  ${new Date(job.createdAt).toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ── activities ───────────────────────────────────────────────────────────────

const activities = program.command('activities').description('View your board activity log');

activities
  .command('list')
  .description('List actions for a board')
  .argument('<board-id>', 'Board ID')
  .option('-f, --format <format>', 'Output format: json | table | csv', parseFormatOption, 'json')
  .option('-j, --json', 'Output as JSON (alias for --format json)')
  .option('-d, --days <n>', 'Show only actions from last N days', parseDaysOption)
  .option('--since <date>', 'Show actions since YYYY-MM-DD', parseDateOption)
  .option('--until <date>', 'Show actions until YYYY-MM-DD (inclusive)', parseDateOption)
  .option('--limit <n>', 'Maximum rows to output', parseLimitOption)
  .option('-w, --week', 'Alias for --days 7')
  .option('--types <types>', 'Comma-separated action types (e.g. JOB_MOVED,NOTE_CREATED)')
  .action(async (boardId, options, command) => {
    try {
      const format = resolveOutputFormat(options);
      const range = resolveDateRange(options);

      const api = await getApi(command.parent?.parent?.opts().token);
      const opts: { since?: Date; types?: string[] } = {};
      if (range.since) opts.since = range.since;
      if (options.types) opts.types = options.types.split(',').map((t: string) => t.trim()).filter(Boolean);

      const actionsRaw = await api.actions.listByBoardFlat(boardId, opts);
      const actions = applyLimit(
        filterByDateRange(actionsRaw, a => a.date || a.createdAt, range),
        options.limit,
      );

      if (format === 'json') {
        console.log(JSON.stringify(actions, null, 2));
      } else if (actions.length === 0) {
        console.log('No activities found.');
      } else if (format === 'csv') {
        printCsv(
          ['date', 'type', 'company', 'job', 'status'],
          actions.map(a => [
            new Date(a.date || a.createdAt).toISOString(),
            a.actionType,
            a.data?.company?.name ?? '',
            a.data?.job?.title ?? '',
            a.data?.toList?.name ?? '',
          ]),
        );
      } else {
        console.table(actions.map(a => ({
          Date: new Date(a.date || a.createdAt).toISOString().substring(0, 16),
          Type: a.actionType,
          Company: a.data?.company?.name ?? '',
          Job: (a.data?.job?.title ?? '').substring(0, 40),
          Status: a.data?.toList?.name ?? '',
        })));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

activities
  .command('week-csv')
  .description('Export last 7 days of activity as CSV')
  .argument('<board-id>', 'Board ID')
  .action(async (boardId, options, command) => {
    try {
      const api = await getApi(command.parent?.parent?.opts().token);
      const rows = await api.actions.weekSummary(boardId);
      const lines = ['Date,Action,Company,Job Title,Status,Job URL'];
      for (const r of rows) {
        lines.push([
          r.date,
          r.actionType,
          `"${r.company.replace(/"/g, '""')}"`,
          `"${r.jobTitle.replace(/"/g, '""')}"`,
          r.status,
          r.url,
        ].join(','));
      }
      console.log(lines.join('\n'));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ── config ───────────────────────────────────────────────────────────────────

const config = program.command('config').description('Manage CLI configuration');

config
  .command('set-token')
  .description('Save API token to config file or keychain')
  .argument('<token>', 'API token to save')
  .option('-k, --keychain', 'Save to macOS Keychain instead of config file')
  .action(async (token, options) => {
    try {
      const location = options.keychain ? 'keychain' : 'config';
      await tokenManager.saveToken(token, location);
      const locationName = options.keychain ? 'macOS Keychain' : '~/.huntr/config.json';
      console.log(`✓ Token saved to ${locationName}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

config
  .command('capture-session')
  .description('Capture Clerk session from your browser automatically (recommended)')
  .action(async () => {
    try {
      await captureSession();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

config
  .command('check-cdp')
  .description('Check Chrome DevTools + Clerk cookie visibility for session capture')
  .action(async () => {
    try {
      await checkCdpSession();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

config
  .command('set-session')
  .description('Save Clerk session cookie for automatic JWT refresh (recommended)')
  .argument('<session-cookie>', 'Value of the __session cookie from your browser')
  .argument('[session-id]', 'Clerk session ID (sess_...) — auto-detected from cookie if omitted')
  .addHelpText('after', `
How to get your __session cookie:
  1. Open huntr.co in Chrome and log in
  2. Open DevTools → Application → Cookies → https://huntr.co
  3. Find the cookie named __session and copy its Value (the long JWT string)
  4. Run: huntr config set-session <value>

The session ID (sess_...) is extracted automatically from the JWT.
The session persists for weeks; re-run set-session if you get auth errors.
  `)
  .action(async (sessionCookie, sessionId) => {
    try {
      const mgr = tokenManager.clerkSession;

      // Auto-detect session ID from the JWT payload (sid claim)
      let resolvedSessionId = sessionId as string | undefined;
      if (!resolvedSessionId) {
        const detected = ClerkSessionManager.extractSessionId(sessionCookie);
        if (detected) {
          resolvedSessionId = detected;
          console.log(`  Session ID detected: ${resolvedSessionId}`);
        } else {
          console.error(
            'Could not auto-detect session ID from the __session JWT.\n' +
            'Find it in the browser console: Clerk.session.id\n' +
            'Then run: huntr config set-session <cookie> <session-id>',
          );
          process.exit(1);
        }
      }

      // Strip prefix if user pasted "__session=..." prefix
      const rawCookie = sessionCookie.startsWith('__session=')
        ? sessionCookie.slice('__session='.length)
        : sessionCookie;

      await mgr.saveSession(rawCookie, resolvedSessionId!);

      // Verify it works immediately
      console.log('  Testing session…');
      try {
        const token = await mgr.getFreshToken();
        console.log(`✓ Session saved and verified (token starts with: ${token.substring(0, 20)}…)`);
        console.log('  Tokens will auto-refresh before each command.');
      } catch (err) {
        console.warn(`⚠ Session saved but test refresh failed: ${err instanceof Error ? err.message : err}`);
        console.warn('  Your cookie may be expired. Try extracting it again from the browser.');
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

config
  .command('test-session')
  .description('Test the stored Clerk session by fetching a fresh token and calling /me')
  .action(async () => {
    try {
      const mgr = tokenManager.clerkSession;
      if (!(await mgr.hasSession())) {
        console.error('No session stored. Run: huntr config set-session <__session-cookie>');
        process.exit(1);
      }
      process.stdout.write('  Refreshing token from Clerk… ');
      const token = await mgr.getFreshToken();
      console.log(`✓ (${token.substring(0, 20)}…)`);
      process.stdout.write('  Calling Huntr API /me… ');
      const api = new (await import('./api/personal')).HuntrPersonalApi(token);
      const profile = await api.user.getProfile();
      console.log('✓');
      console.log(`\n  Logged in as: ${profile.givenName ?? profile.firstName ?? ''} ${profile.familyName ?? profile.lastName ?? ''} <${profile.email}>`);
      console.log('  Session is working correctly. Tokens auto-refresh before each command.');
    } catch (error) {
      console.error('\nFailed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

config
  .command('show-token')
  .description('Show which authentication sources are configured')
  .action(async () => {
    try {
      const sources = await tokenManager.showTokenSources();
      console.log('\nConfigured authentication sources:');
      console.log(`  Environment variable (HUNTR_API_TOKEN): ${sources.env          ? '✓ Set' : '✗ Not set'}`);
      console.log(`  Clerk session (auto-refresh):           ${sources.clerkSession ? '✓ Set' : '✗ Not set'}`);
      console.log(`  Config file (~/.huntr/config.json):     ${sources.config       ? '✓ Set' : '✗ Not set'}`);
      console.log(`  macOS Keychain:                         ${sources.keychain     ? '✓ Set' : '✗ Not set'}`);
      if (!sources.env && !sources.clerkSession && !sources.config && !sources.keychain) {
        console.log('\nNo credentials found.');
        console.log('Recommended: huntr config set-session <__session-cookie>');
        console.log('Alternative: huntr config set-token <token> [--keychain]');
      } else if (sources.clerkSession) {
        console.log('\n✓ Clerk session active — tokens refresh automatically.');
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

config
  .command('clear-token')
  .description('Remove saved API token')
  .option('-k, --keychain', 'Clear from macOS Keychain only')
  .option('-c, --config', 'Clear from config file only')
  .action(async (options) => {
    try {
      let location: 'config' | 'keychain' | 'all' = 'all';
      if (options.keychain && !options.config) location = 'keychain';
      else if (options.config && !options.keychain) location = 'config';
      await tokenManager.clearToken(location);
      const message = location === 'all' ? 'all locations'
        : location === 'keychain' ? 'macOS Keychain'
        : 'config file';
      console.log(`✓ Token cleared from ${message}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

config
  .command('clear-session')
  .description('Remove saved Clerk session cookie')
  .action(async () => {
    try {
      await tokenManager.clerkSession.clearSession();
      console.log('✓ Clerk session cleared');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ── completions ──────────────────────────────────────────────────────────────

program
  .command('completions')
  .description('Generate shell completion script')
  .argument('<shell>', 'Shell to generate completions for: bash | zsh | fish')
  .addHelpText('after', `
Examples:
  # bash
  huntr completions bash >> ~/.bash_completion
  source ~/.bash_completion

  # zsh (oh-my-zsh or fpath)
  huntr completions zsh > "$HOME/.zsh/completions/_huntr"
  # then add $HOME/.zsh/completions to your fpath in ~/.zshrc

  # fish
  huntr completions fish > ~/.config/fish/completions/huntr.fish
  `)
  .action((shell: string) => {
    switch (shell) {
      case 'bash':
        /* eslint-disable no-useless-escape */
        console.log(`# huntr bash completion
# Add to ~/.bash_completion or ~/.bashrc:
#   source <(huntr completions bash)

_huntr_completions() {
  local cur prev words cword
  _init_completion || return

  local top_commands="me boards jobs activities config completions"
  local boards_commands="list get"
  local jobs_commands="list get"
  local activities_commands="list week-csv"
  local config_commands="set-token capture-session check-cdp set-session test-session show-token clear-token clear-session"

  case "\${words[1]}" in
    boards)
      COMPREPLY=( \$(compgen -W "\${boards_commands}" -- "\${cur}") )
      return ;;
    jobs)
      COMPREPLY=( \$(compgen -W "\${jobs_commands}" -- "\${cur}") )
      return ;;
    activities)
      COMPREPLY=( \$(compgen -W "\${activities_commands}" -- "\${cur}") )
      return ;;
    config)
      COMPREPLY=( \$(compgen -W "\${config_commands}" -- "\${cur}") )
      return ;;
    completions)
      COMPREPLY=( \$(compgen -W "bash zsh fish" -- "\${cur}") )
      return ;;
  esac

  COMPREPLY=( \$(compgen -W "\${top_commands}" -- "\${cur}") )
}

complete -F _huntr_completions huntr
`);
        /* eslint-enable no-useless-escape */
        break;

      case 'zsh':
        /* eslint-disable no-useless-escape */
        console.log(`#compdef huntr
# huntr zsh completion
# Save to a directory in your fpath, e.g. ~/.zsh/completions/_huntr

_huntr() {
  local -a top_commands boards_commands jobs_commands activities_commands config_commands
  top_commands=(
    'me:Show your user profile'
    'boards:Manage your boards'
    'jobs:Manage jobs on your boards'
    'activities:View your board activity log'
    'config:Manage CLI configuration'
    'completions:Generate shell completion script'
  )
  boards_commands=('list:List all your boards' 'get:Get details of a specific board')
  jobs_commands=('list:List jobs on a board' 'get:Get details of a specific job')
  activities_commands=('list:List actions for a board' 'week-csv:Export last 7 days of activity as CSV')
  config_commands=(
    'set-token:Save API token'
    'capture-session:Capture Clerk session from browser'
    'check-cdp:Check Chrome DevTools connectivity'
    'set-session:Save Clerk session cookie'
    'test-session:Test stored Clerk session'
    'show-token:Show configured auth sources'
    'clear-token:Remove saved API token'
    'clear-session:Remove saved Clerk session'
  )

  local state
  _arguments -C \\
    '(-t --token)'{-t,--token}'[API token]:token:' \\
    '1: :->command' \\
    '*: :->args' && return 0

  case \$state in
    command) _describe 'command' top_commands ;;
    args)
      case \$words[2] in
        boards)      _describe 'boards command' boards_commands ;;
        jobs)        _describe 'jobs command' jobs_commands ;;
        activities)  _describe 'activities command' activities_commands ;;
        config)      _describe 'config command' config_commands ;;
        completions) _values 'shell' bash zsh fish ;;
      esac ;;
  esac
}

_huntr "\$@"
`);
        /* eslint-enable no-useless-escape */
        break;

      case 'fish':
        console.log(`# huntr fish completion
# Save to ~/.config/fish/completions/huntr.fish

set -l top_commands me boards jobs activities config completions

# Disable file completions globally
complete -c huntr -f

# Top-level commands
complete -c huntr -n "__fish_use_subcommand" -a me          -d "Show your user profile"
complete -c huntr -n "__fish_use_subcommand" -a boards      -d "Manage your boards"
complete -c huntr -n "__fish_use_subcommand" -a jobs        -d "Manage jobs on your boards"
complete -c huntr -n "__fish_use_subcommand" -a activities  -d "View your board activity log"
complete -c huntr -n "__fish_use_subcommand" -a config      -d "Manage CLI configuration"
complete -c huntr -n "__fish_use_subcommand" -a completions -d "Generate shell completion script"

# Global flag
complete -c huntr -s t -l token -d "API token (overrides all other sources)" -r

# boards subcommands
complete -c huntr -n "__fish_seen_subcommand_from boards"     -a list -d "List all your boards"
complete -c huntr -n "__fish_seen_subcommand_from boards"     -a get  -d "Get details of a specific board"

# jobs subcommands
complete -c huntr -n "__fish_seen_subcommand_from jobs"       -a list -d "List jobs on a board"
complete -c huntr -n "__fish_seen_subcommand_from jobs"       -a get  -d "Get details of a specific job"

# activities subcommands
complete -c huntr -n "__fish_seen_subcommand_from activities" -a list     -d "List actions for a board"
complete -c huntr -n "__fish_seen_subcommand_from activities" -a week-csv -d "Export last 7 days as CSV"

# config subcommands
complete -c huntr -n "__fish_seen_subcommand_from config" -a set-token        -d "Save API token"
complete -c huntr -n "__fish_seen_subcommand_from config" -a capture-session  -d "Capture Clerk session from browser"
complete -c huntr -n "__fish_seen_subcommand_from config" -a check-cdp        -d "Check Chrome DevTools connectivity"
complete -c huntr -n "__fish_seen_subcommand_from config" -a set-session      -d "Save Clerk session cookie"
complete -c huntr -n "__fish_seen_subcommand_from config" -a test-session     -d "Test stored Clerk session"
complete -c huntr -n "__fish_seen_subcommand_from config" -a show-token       -d "Show configured auth sources"
complete -c huntr -n "__fish_seen_subcommand_from config" -a clear-token      -d "Remove saved API token"
complete -c huntr -n "__fish_seen_subcommand_from config" -a clear-session    -d "Remove saved Clerk session"

# completions shell argument
complete -c huntr -n "__fish_seen_subcommand_from completions" -a "bash zsh fish"
`);
        break;

      default:
        console.error(`Unknown shell: ${shell}. Supported: bash, zsh, fish`);
        process.exit(1);
    }
  });

program.parse();
