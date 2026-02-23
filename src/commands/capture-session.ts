#!/usr/bin/env node
/**
 * Session capture via Chrome DevTools Protocol (CDP).
 * - Connects to a Chrome instance started with --remote-debugging-port.
 * - Reads required Huntr/Clerk cookies from the active huntr.co tab.
 * - Verifies refresh with Clerk and stores session data in macOS Keychain.
 */

import { mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';
import net from 'net';
import { ClerkSessionManager } from '../config/clerk-session-manager';

const CDP_PORT = 9222;
const CDP_USER_DATA_DIR = join(tmpdir(), 'huntr-cdp-profile');
const HUNTR_APP_URL = 'https://huntr.co/home';
const HUNTR_COOKIE_URLS = ['https://huntr.co/', HUNTR_APP_URL, 'https://clerk.huntr.co/'];
const CAPTURED_COOKIE_NAMES = new Set(['__session', '__client_uat', '__client', '__cf_bm', '_cfuvid']);
const TAB_WAIT_TIMEOUT_MS = 45_000;
const TOKEN_WAIT_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_500;
const CLERK_SESSION_ID_EVAL_EXPRESSION = `(() => {
  const sid = window.Clerk?.session?.id;
  return typeof sid === 'string' ? sid : '';
})()`;

type ChromeTab = {
  url?: string;
  type?: string;
  title?: string;
  webSocketDebuggerUrl?: string;
};

type SessionCookieWaitResult = {
  sessionCookie: string | null;
  sessionId?: string;
  clientUat?: string | null;
  extraCookies?: Record<string, string>;
  freshToken?: string;
  tab?: ChromeTab;
  lastValueDescription?: string;
  lastError?: string;
};

type SessionSnapshot = {
  sessionCookie: string;
  clientUat: string | null;
  extraCookies: Record<string, string>;
  clerkSessionId: string | null;
};

export async function captureSession(): Promise<void> {
  console.log('\nConnecting to Chrome via DevTools Protocol…');

  // Step 1: Check if Chrome is already running with remote debugging
  let tabs = await getChromeTabs().catch(() => null);

  if (!tabs) {
    console.log('  Chrome not running with --remote-debugging-port. Launching…');
    await launchChromeWithDebugging();
    // Give it a moment to start
    await new Promise(r => setTimeout(r, 2000));
    tabs = await getChromeTabs().catch(() => null);
  }

  if (!tabs) {
    throw new Error(
      'Could not connect to Chrome DevTools Protocol.\n' +
      'Please quit Chrome and re-run this command, or start Chrome manually with:\n' +
      `  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${CDP_PORT} --user-data-dir=${CDP_USER_DATA_DIR} ${HUNTR_APP_URL}\n` +
      '  (If this is your first run, sign in to huntr.co in that profile once.)\n' +
      'Then run: huntr config capture-session',
    );
  }

  // Step 2: Find the huntr.co tab
  let huntrTab = findBestHuntrTab(tabs);
  if (!huntrTab) {
    console.log(`  Opening ${HUNTR_APP_URL} in debug profile…`);
    await openHuntrAppInDebugProfile();
  }

  console.log('  Waiting for huntr.co tab to become available…');
  huntrTab = await waitForHuntrTab(TAB_WAIT_TIMEOUT_MS);
  if (!huntrTab || !huntrTab.webSocketDebuggerUrl) {
    throw new Error(
      'No huntr.co tab found in Chrome DevTools.\n' +
      `Please open ${HUNTR_APP_URL} in Chrome (in the debug profile) and re-run.`,
    );
  }

  console.log(`  Found huntr.co tab: ${huntrTab.title}`);
  const mgr = new ClerkSessionManager();
  console.log('  Waiting for login and extracting Clerk session cookie…');

  // Step 3: Poll until we have a cookie pair that actually refreshes via Clerk
  const cookieWait = await waitForValidHuntrSessionCookie(mgr, TOKEN_WAIT_TIMEOUT_MS);
  if (!cookieWait.sessionCookie) {
    const details = [
      `Last tab URL: ${cookieWait.tab?.url ?? '(none)'}`,
      cookieWait.lastValueDescription ? `Last cookie value: ${cookieWait.lastValueDescription}` : '',
      cookieWait.lastError ? `Last eval error: ${cookieWait.lastError}` : '',
    ].filter(Boolean).join('\n');
    throw new Error(
      'Timed out waiting for authenticated huntr session.\n' +
      'Please finish signing in on the opened Chrome window, then re-run.\n' +
      details,
    );
  }
  const sessionCookie = cookieWait.sessionCookie;
  const sessionId = cookieWait.sessionId;
  const clientUat = cookieWait.clientUat;
  const extraCookies = cookieWait.extraCookies ?? {};

  if (!sessionId) {
    throw new Error('Could not extract session ID from session cookie.');
  }

  console.log(`  Session ID: ${sessionId}`);

  await mgr.saveSession(sessionCookie, sessionId, clientUat ?? undefined, extraCookies);
  console.log('  Saved to macOS Keychain.');

  // Step 5: Immediately test the refresh endpoint
  process.stdout.write('  Testing auto-refresh… ');
  await mgr.getFreshToken();
  console.log('✓');
  console.log('\n✓ Session captured and verified!');
  console.log('  Tokens will auto-refresh before every command.');
  console.log('  Run: node dist/cli.js activities week-csv 68bf9e33f871e5004a5eb58e');
}

export async function checkCdpSession(): Promise<void> {
  console.log('\nChecking Chrome DevTools session visibility…');
  const tabs = await getChromeTabs().catch(() => null);

  if (!tabs) {
    throw new Error(
      'Could not connect to Chrome DevTools Protocol.\n' +
      'Start Chrome with:\n' +
      `  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${CDP_PORT} --user-data-dir=${CDP_USER_DATA_DIR} ${HUNTR_APP_URL}`,
    );
  }

  const huntrTab = findBestHuntrTab(tabs);
  if (!huntrTab?.webSocketDebuggerUrl) {
    throw new Error('No huntr.co page tab found. Open huntr.co in the debug-profile Chrome and retry.');
  }

  console.log(`  Using tab: ${huntrTab.title ?? '(untitled)'}`);
  console.log(`  URL: ${huntrTab.url ?? '(unknown)'}`);

  const snapshot = await getSessionSnapshotInTab(huntrTab.webSocketDebuggerUrl, huntrTab.url);
  if (!snapshot?.sessionCookie) {
    throw new Error(
      'CDP connected, but __session cookie is not visible yet.\n' +
      'Finish login in that tab, wait for the app page to load, then retry.',
    );
  }

  const sessionId =
    ClerkSessionManager.extractSessionId(snapshot.sessionCookie) ??
    snapshot.clerkSessionId ??
    undefined;
  if (!sessionId || !sessionId.startsWith('sess_')) {
    throw new Error('Found __session cookie, but could not derive a valid Clerk session ID.');
  }

  const visibleCookies = [
    '__session',
    snapshot.clientUat ? '__client_uat' : null,
    ...Object.keys(snapshot.extraCookies),
  ].filter(Boolean) as string[];
  console.log(`  Visible cookies: ${visibleCookies.sort().join(', ')}`);

  const mgr = new ClerkSessionManager();
  process.stdout.write('  Testing Clerk refresh with visible cookies… ');
  const fresh = await mgr.refreshFromProvidedSession(
    snapshot.sessionCookie,
    sessionId,
    snapshot.clientUat,
    snapshot.extraCookies,
  );
  console.log('✓');
  console.log(`  Session ID: ${sessionId}`);
  console.log(`  Refresh token preview: ${fresh.substring(0, 20)}…`);
}

async function getChromeTabs(): Promise<ChromeTab[]> {
  const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  if (!response.ok) throw new Error(`CDP returned ${response.status}`);
  const json: unknown = await response.json();
  if (!Array.isArray(json)) throw new Error('Unexpected CDP /json response');
  return json as ChromeTab[];
}

async function launchChromeWithDebugging(): Promise<void> {
  // Chrome requires an explicit user-data-dir when remote debugging is enabled.
  mkdirSync(CDP_USER_DATA_DIR, { recursive: true });
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  spawn(chromePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${CDP_USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    HUNTR_APP_URL,
  ], { detached: true, stdio: 'ignore' }).unref();
}

async function openHuntrAppInDebugProfile(): Promise<void> {
  // Launching again with the same user-data-dir opens a tab in that profile.
  await launchChromeWithDebugging();
}

async function waitForHuntrTab(timeoutMs: number): Promise<ChromeTab | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const tabs = await getChromeTabs().catch(() => null);
    const tab = tabs ? findBestHuntrTab(tabs) : undefined;
    if (tab?.webSocketDebuggerUrl) return tab;
    await sleep(POLL_INTERVAL_MS);
  }
  return undefined;
}

async function waitForValidHuntrSessionCookie(
  mgr: ClerkSessionManager,
  timeoutMs: number,
): Promise<SessionCookieWaitResult> {
  const deadline = Date.now() + timeoutMs;
  let lastTab: ChromeTab | undefined;
  let lastValueDescription: string | undefined;
  let lastError: string | undefined;
  let printedHint = false;

  while (Date.now() < deadline) {
    const tabs = await getChromeTabs().catch(() => null);
    const huntrTabs = tabs ? findHuntrTabs(tabs) : [];

    for (const tab of huntrTabs) {
      if (!tab.webSocketDebuggerUrl) continue;
      lastTab = tab;

      try {
        const snapshot = await getSessionSnapshotInTab(tab.webSocketDebuggerUrl, tab.url);
        lastValueDescription = describeValue(snapshot);

        if (!snapshot?.sessionCookie || snapshot.sessionCookie.split('.').length !== 3) {
          continue;
        }

        const sessionId =
          ClerkSessionManager.extractSessionId(snapshot.sessionCookie) ??
          snapshot.clerkSessionId ??
          undefined;

        if (!sessionId || !sessionId.startsWith('sess_')) {
          continue;
        }

        const freshToken = await mgr.refreshFromProvidedSession(
          snapshot.sessionCookie,
          sessionId,
          snapshot.clientUat,
          snapshot.extraCookies,
        );
        if (freshToken && freshToken.split('.').length === 3) {
          return {
            sessionCookie: snapshot.sessionCookie,
            sessionId,
            clientUat: snapshot.clientUat,
            extraCookies: snapshot.extraCookies,
            freshToken,
            tab,
            lastValueDescription,
            lastError,
          };
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (!printedHint && huntrTabs.length > 0) {
      console.log('  Waiting for you to finish signing into huntr.co in that Chrome window…');
      printedHint = true;
    }
    await sleep(POLL_INTERVAL_MS);
  }

  return { sessionCookie: null, tab: lastTab, lastValueDescription, lastError };
}

function isHuntrAppTab(tab: ChromeTab): boolean {
  if (!tab.url || tab.type !== 'page') return false;
  try {
    const parsed = new URL(tab.url);
    if (!parsed.hostname.endsWith('huntr.co')) return false;
    return parsed.pathname !== '/' && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

function isHuntrTab(tab: ChromeTab): boolean {
  if (!tab.url || tab.type !== 'page') return false;
  try {
    const parsed = new URL(tab.url);
    return parsed.hostname.endsWith('huntr.co');
  } catch {
    return false;
  }
}

function findHuntrTabs(tabs: ChromeTab[]): ChromeTab[] {
  const huntrTabs = tabs.filter(isHuntrTab);
  const appTabs = huntrTabs.filter(isHuntrAppTab);
  return appTabs.length > 0 ? appTabs : huntrTabs;
}

function findBestHuntrTab(tabs: ChromeTab[]): ChromeTab | undefined {
  return findHuntrTabs(tabs)[0];
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function getSessionSnapshotInTab(wsUrl: string, pageUrl?: string): Promise<SessionSnapshot | null> {
  const cookies = await getCookiesInTab(wsUrl, pageUrl);
  const sessionCookie = cookies.__session ?? null;
  if (!sessionCookie) return null;

  const clerkSessionIdRaw = await evaluateInTab(wsUrl, CLERK_SESSION_ID_EVAL_EXPRESSION).catch(() => '');
  const clerkSessionId =
    typeof clerkSessionIdRaw === 'string' && clerkSessionIdRaw.startsWith('sess_')
      ? clerkSessionIdRaw
      : null;

  return {
    sessionCookie,
    clientUat: cookies.__client_uat ?? null,
    extraCookies: Object.fromEntries(
      Object.entries(cookies).filter(([name]) => name !== '__session' && name !== '__client_uat'),
    ),
    clerkSessionId,
  };
}

async function getCookiesInTab(wsUrl: string, pageUrl?: string): Promise<Record<string, string>> {
  try {
    await cdpRequestInTab(wsUrl, 'Network.enable');
  } catch {
    // Not all targets require/allow Network.enable first.
  }

  const urls = pageUrl ? Array.from(new Set([pageUrl, ...HUNTR_COOKIE_URLS])) : HUNTR_COOKIE_URLS;
  const result = await cdpRequestInTab(wsUrl, 'Network.getCookies', { urls });
  const cookies = (result as { cookies?: unknown[] } | null)?.cookies;
  const out: Record<string, string> = {};

  if (!Array.isArray(cookies)) return out;

  for (const cookie of cookies) {
    if (!cookie || typeof cookie !== 'object') continue;
    const c = cookie as Record<string, unknown>;
    const name = c.name;
    const value = c.value;
    const domain = c.domain;

    if (typeof name !== 'string' || typeof value !== 'string') continue;
    if (typeof domain === 'string' && !domain.includes('huntr.co')) continue;
    if (CAPTURED_COOKIE_NAMES.has(name)) {
      out[name] = value;
    }
  }

  return out;
}

async function evaluateInTab(wsUrl: string, expression: string): Promise<unknown> {
  const result = await cdpRequestInTab(wsUrl, 'Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  const evalResult = (result ?? {}) as Record<string, unknown>;
  const exceptionDetails = evalResult.exceptionDetails as Record<string, unknown> | undefined;
  if (exceptionDetails) {
    const text = typeof exceptionDetails.text === 'string' ? exceptionDetails.text : 'Runtime.evaluate failed';
    throw new Error(text);
  }

  const runtimeResult = evalResult.result as Record<string, unknown> | undefined;
  if (!runtimeResult || !Object.prototype.hasOwnProperty.call(runtimeResult, 'value')) return undefined;
  return runtimeResult.value;
}

function cdpRequestInTab(
  wsUrl: string,
  method: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // Use Node's built-in WebSocket (Node 22+) or fall back to a raw WS handshake
    const WebSocketImpl = (globalThis as any).WebSocket;

    if (WebSocketImpl) {
      connectWithWebSocket(wsUrl, WebSocketImpl, method, params, resolve, reject);
    } else {
      // Node < 22: implement minimal WS client over net/tls
      connectWithRawWS(wsUrl, method, params, resolve, reject);
    }
  });
}

function connectWithWebSocket(
  wsUrl: string,
  WS: typeof WebSocket,
  method: string,
  params: Record<string, unknown>,
  resolve: (v: unknown) => void,
  reject: (e: Error) => void,
): void {
  const ws = new WS(wsUrl);
  const id = 1;

  ws.onopen = () => {
    ws.send(JSON.stringify({
      id,
      method,
      params,
    }));
  };

  ws.onmessage = async (evt: MessageEvent) => {
    try {
      const raw = await wsDataToText(evt.data);
      const msg = JSON.parse(raw);
      if (msg.id !== id) return;
      if (msg.error) {
        ws.close();
        reject(new Error(msg.error?.message ?? `CDP ${method} failed`));
        return;
      }

      ws.close();
      resolve(msg.result as unknown);
    } catch (e) {
      ws.close();
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  };

  ws.onerror = () => reject(new Error('WebSocket connection to Chrome DevTools failed'));

  setTimeout(() => { ws.close(); reject(new Error('Timeout waiting for Chrome response')); }, 10_000);
}

async function wsDataToText(data: unknown): Promise<string> {
  if (typeof data === 'string') return data;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) return data.toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  if (typeof Blob !== 'undefined' && data instanceof Blob) return await data.text();
  return String(data);
}

function connectWithRawWS(
  wsUrl: string,
  method: string,
  params: Record<string, unknown>,
  resolve: (v: unknown) => void,
  reject: (e: Error) => void,
): void {
  // Parse ws://host:port/path
  const match = wsUrl.match(/^ws:\/\/([^/:]+):(\d+)(\/.*)?$/);
  if (!match) { reject(new Error(`Cannot parse WS URL: ${wsUrl}`)); return; }

  const host = match[1];
  const port = parseInt(match[2], 10);
  const path = match[3] ?? '/';

  const socket = net.createConnection(port, host);

  const key = Buffer.from(Math.random().toString(36)).toString('base64');
  let buffer = '';
  let handshakeDone = false;
  const msgId = 1;

  socket.on('connect', () => {
    socket.write(
      `GET ${path} HTTP/1.1\r\n` +
      `Host: ${host}:${port}\r\n` +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Key: ${key}\r\n` +
      'Sec-WebSocket-Version: 13\r\n\r\n',
    );
  });

  socket.on('data', (data: Buffer) => {
    if (!handshakeDone) {
      buffer += data.toString();
      if (buffer.includes('\r\n\r\n')) {
        handshakeDone = true;
        // Send the evaluate command
        const payload = JSON.stringify({
          id: msgId,
          method,
          params,
        });
        socket.write(encodeWsFrame(payload));
      }
      return;
    }

    // Parse WebSocket frame
    try {
      const msg = decodeWsFrame(data);
      if (msg) {
        const parsed = JSON.parse(msg);
        if (parsed.id !== msgId) return;
        if (parsed.error) {
          socket.destroy();
          reject(new Error(parsed.error?.message ?? `CDP ${method} failed`));
          return;
        }

        socket.destroy();
        resolve(parsed.result as unknown);
      }
    } catch {
      // partial frame, wait for more data
    }
  });

  socket.on('error', (e: Error) => reject(e));
  setTimeout(() => { socket.destroy(); reject(new Error('Timeout')); }, 10_000);
}

function describeValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `string, ${value.length} chars`;
  if (Array.isArray(value)) return `array, ${value.length} items`;
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    return `object, keys: ${keys.slice(0, 6).join(', ') || '(none)'}`;
  }
  return typeof value;
}

function encodeWsFrame(payload: string): Buffer {
  const data = Buffer.from(payload, 'utf8');
  const len = data.length;
  const mask = Buffer.from([
    Math.random() * 256, Math.random() * 256,
    Math.random() * 256, Math.random() * 256,
  ].map(Math.floor));

  const header = len < 126
    ? Buffer.from([0x81, 0x80 | len])
    : len < 65536
    ? Buffer.from([0x81, 0xfe, len >> 8, len & 0xff])
    : Buffer.from([0x81, 0xff, 0, 0, 0, 0, (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);

  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) masked[i] = data[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

function decodeWsFrame(buf: Buffer): string | null {
  if (buf.length < 2) return null;
  const len = buf[1] & 0x7f;
  let offset = 2;
  const payloadLen = len < 126 ? len : len === 126 ? (buf.readUInt16BE(2), offset += 2, buf.readUInt16BE(2)) : null;
  if (payloadLen === null) return null;
  return buf.slice(offset, offset + (payloadLen as number)).toString('utf8');
}
