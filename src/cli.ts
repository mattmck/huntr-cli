#!/usr/bin/env node

import { Command } from 'commander';
import { HuntrPersonalApi } from './api/personal';
import { TokenManager } from './config/token-manager';
import { ClerkSessionManager } from './config/clerk-session-manager';
import { captureSession, checkCdpSession } from './commands/capture-session';
import {
  parseListOptions,
  validateFields,
  formatTableWithFields,
  formatCsvWithFields,
  formatJsonWithFields,
  formatPdf,
  formatExcel,
} from './lib/list-options';

const program = new Command();
const tokenManager = new TokenManager();

async function getApi(token?: string): Promise<HuntrPersonalApi> {
  const provider = await tokenManager.getTokenProvider({ token });
  return new HuntrPersonalApi(provider);
}

program
  .name('huntr')
  .description('CLI tool for Huntr')
  .version('1.0.0')
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
  .option('-f, --format <format>', 'Output format: table (default), json, csv, pdf, excel')
  .option('-j, --json', 'Output as JSON (legacy, same as --format json)')
  .option('--fields <fields>', 'Comma-separated list of fields to include')
  .action(async (options, command) => {
    try {
      const AVAILABLE_FIELDS = ['ID', 'Name', 'Created'];
      const listOpts = parseListOptions(options);
      const fields = validateFields(AVAILABLE_FIELDS, listOpts.fields);

      const api = await getApi(command.parent?.parent?.opts().token);
      const response = await api.boards.list();
      const boardsList = Array.isArray(response) ? response : (response as any).data ?? [];

      if (boardsList.length === 0) {
        console.log('No boards found.');
        return;
      }

      const rows = boardsList.map((b: any) => ({
        ID: b.id,
        Name: b.name ?? 'N/A',
        Created: new Date(b.createdAt).toLocaleDateString(),
      }));

      if (listOpts.format === 'json') {
        console.log(formatJsonWithFields(rows, fields));
      } else if (listOpts.format === 'csv') {
        console.log(formatCsvWithFields(rows, fields));
      } else if (listOpts.format === 'pdf') {
        const buffer = formatPdf(rows, fields, 'Boards List');
        process.stdout.write(buffer);
      } else if (listOpts.format === 'excel') {
        const buffer = await formatExcel(rows, fields, 'Boards');
        process.stdout.write(buffer);
      } else {
        console.log(formatTableWithFields(rows, fields));
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

const JOB_AVAILABLE_FIELDS: ReadonlyArray<string> = [
  'ID', 'Title', 'URL', 'RootDomain', 'Description',
  'CompanyId', 'ListId', 'BoardId',
  'SalaryMin', 'SalaryMax', 'SalaryCurrency',
  'LocationAddress', 'LocationName', 'LocationUrl', 'LocationLat', 'LocationLng',
  'Created', 'Updated', 'LastMoved',
];

jobs
  .command('fields')
  .description('List available fields for jobs list')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const rows = JOB_AVAILABLE_FIELDS.map((f: string) => ({ Field: f }));
      if (options.json) {
        console.log(JSON.stringify(rows.map(r => r.Field), null, 2));
      } else {
        console.log(formatTableWithFields(rows, ['Field']));
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

jobs
  .command('list')
  .description('List jobs on a board')
  .argument('<board-id>', 'Board ID')
  .option('-f, --format <format>', 'Output format: table (default), json, csv, pdf, excel')
  .option('-j, --json', 'Output as JSON (legacy, same as --format json)')
  .option('--fields <fields>', 'Comma-separated list of fields to include (use "help" or "all")')
  .action(async (boardId, options, command) => {
    try {
      const AVAILABLE_FIELDS = [...JOB_AVAILABLE_FIELDS];
      const listOpts = parseListOptions(options);

      // If user asked for field help, print and exit success
      const wantsHelp = (listOpts.fields ?? []).some(f => /^(help|\?)$/i.test(f));
      if (wantsHelp) {
        const rows = AVAILABLE_FIELDS.map(f => ({ Field: f }));
        console.log(formatTableWithFields(rows, ['Field']));
        return;
      }

      const requested = listOpts.fields;
      const fields = (requested && requested.length === 1 && /^(all)$/i.test(requested[0]))
        ? AVAILABLE_FIELDS.slice()
        : validateFields(AVAILABLE_FIELDS, requested);

      const api = await getApi(command.parent?.parent?.opts().token);
      const jobsList = await api.jobs.listByBoardFlat(boardId);

      if (jobsList.length === 0) {
        console.log('No jobs found.');
        return;
      }

      const rows = jobsList.map(j => ({
        ID: j.id,
        Title: j.title ?? '',
        URL: j.url ?? '',
        RootDomain: j.rootDomain ?? '',
        Description: j.htmlDescription ?? '',
        CompanyId: j._company ?? '',
        ListId: j._list ?? '',
        BoardId: j._board ?? '',
        SalaryMin: j.salary?.min ?? '',
        SalaryMax: j.salary?.max ?? '',
        SalaryCurrency: j.salary?.currency ?? '',
        LocationAddress: j.location?.address ?? '',
        LocationName: j.location?.name ?? '',
        LocationUrl: j.location?.url ?? '',
        LocationLat: j.location?.lat ?? '',
        LocationLng: j.location?.lng ?? '',
        Created: new Date(j.createdAt).toLocaleDateString(),
        Updated: j.updatedAt ? new Date(j.updatedAt).toLocaleDateString() : '',
        LastMoved: j.lastMovedAt ? new Date(j.lastMovedAt).toLocaleDateString() : '',
      }));

      if (listOpts.format === 'json') {
        console.log(formatJsonWithFields(rows, fields));
      } else if (listOpts.format === 'csv') {
        console.log(formatCsvWithFields(rows, fields));
      } else if (listOpts.format === 'pdf') {
        const buffer = formatPdf(rows, fields, 'Jobs List');
        process.stdout.write(buffer);
      } else if (listOpts.format === 'excel') {
        const buffer = await formatExcel(rows, fields, 'Jobs');
        process.stdout.write(buffer);
      } else {
        console.log(formatTableWithFields(rows, fields));
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
  .option('-f, --format <format>', 'Output format: table (default), json, csv, pdf, excel')
  .option('-d, --days <days>', 'Filter to last N days (e.g. 7 for past week)')
  .option('-w, --week', 'Filter to last 7 days (legacy, same as --days 7)')
  .option('--types <types>', 'Comma-separated action types (e.g. JOB_MOVED,NOTE_CREATED)')
  .option('--fields <fields>', 'Comma-separated list of fields to include')
  .option('-j, --json', 'Output as JSON (legacy, same as --format json)')
  .action(async (boardId, options, command) => {
    try {
      const AVAILABLE_FIELDS = ['Date', 'Type', 'Company', 'Job', 'Status'];
      const listOpts = parseListOptions(options);
      const fields = validateFields(AVAILABLE_FIELDS, listOpts.fields);

      const api = await getApi(command.parent?.parent?.opts().token);

      const apiOpts: { since?: Date; types?: string[] } = {};
      if (listOpts.days) {
        apiOpts.since = new Date(Date.now() - listOpts.days * 24 * 60 * 60 * 1000);
      }
      if (listOpts.types) {
        apiOpts.types = listOpts.types;
      }

      const actions = await api.actions.listByBoardFlat(boardId, apiOpts);

      if (actions.length === 0) {
        console.log('No activities found.');
        return;
      }

      const rows = actions.map(a => ({
        Date:    new Date(a.date || a.createdAt).toISOString().substring(0, 16),
        Type:    a.actionType,
        Company: a.data?.company?.name ?? '',
        Job:     (a.data?.job?.title ?? '').substring(0, 40),
        Status:  a.data?.toList?.name ?? '',
      }));

      if (listOpts.format === 'json') {
        console.log(formatJsonWithFields(rows, fields));
      } else if (listOpts.format === 'csv') {
        console.log(formatCsvWithFields(rows, fields));
      } else if (listOpts.format === 'pdf') {
        const buffer = formatPdf(rows, fields, 'Activities List');
        process.stdout.write(buffer);
      } else if (listOpts.format === 'excel') {
        const buffer = await formatExcel(rows, fields, 'Activities');
        process.stdout.write(buffer);
      } else {
        console.log(formatTableWithFields(rows, fields));
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

program.parse();
