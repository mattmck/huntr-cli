import keytar from 'keytar';
import https from 'https';

const SERVICE_NAME = 'huntr-cli';
const ACCOUNT_SESSION_COOKIE = 'clerk-session-cookie';  // __session value
const ACCOUNT_SESSION_ID = 'clerk-session-id';           // sess_...
const ACCOUNT_CLIENT_UAT = 'clerk-client-uat';          // __client_uat value (optional)
const ACCOUNT_EXTRA_COOKIES = 'clerk-extra-cookies';    // JSON map of clerk-domain cookies

const CLERK_HOST = 'clerk.huntr.co';

/**
 * Manages Clerk session-based JWT refresh for the Huntr CLI.
 *
 * Modern Clerk architecture (v5+):
 *   - __session cookie  : stores the short-lived session JWT (60s exp).
 *                         The cookie itself has a long expiry (1 year);
 *                         Clerk JS updates its *value* via FAPI silently.
 *   - __client_uat      : Unix timestamp of last client update — not a credential.
 *
 * To refresh from outside a browser, we POST the __session value to Clerk's
 * FAPI tokens endpoint. Clerk validates the session and returns a fresh JWT.
 *
 * Endpoint:
 *   POST https://clerk.huntr.co/v1/client/sessions/{sessionId}/tokens
 *   Cookie: __session=<value>
 *   Response: { jwt: "ey..." }
 *
 * The __session value must be re-extracted from the browser periodically
 * (roughly every few weeks, when Clerk rotates the underlying session).
 * For daily use it persists fine.
 */
export class ClerkSessionManager {
  // ── storage ──────────────────────────────────────────────────────────────

  async saveSession(
    sessionCookieValue: string,
    sessionId: string,
    clientUat?: string,
    extraCookies?: Record<string, string>,
  ): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_SESSION_COOKIE, sessionCookieValue);
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_SESSION_ID, sessionId);
    if (clientUat) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_CLIENT_UAT, clientUat);
    }
    if (extraCookies && Object.keys(extraCookies).length > 0) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_EXTRA_COOKIES, JSON.stringify(extraCookies));
    }
  }

  async getSessionCookie(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_SESSION_COOKIE);
  }

  async getSessionId(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_SESSION_ID);
  }

  async getClientUat(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_CLIENT_UAT);
  }

  async getExtraCookies(): Promise<Record<string, string>> {
    const raw = await keytar.getPassword(SERVICE_NAME, ACCOUNT_EXTRA_COOKIES);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.length > 0) out[k] = v;
      }
      return out;
    } catch {
      return {};
    }
  }

  async clearSession(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_SESSION_COOKIE);
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_SESSION_ID);
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_CLIENT_UAT);
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_EXTRA_COOKIES);
  }

  async hasSession(): Promise<boolean> {
    const cookie = await this.getSessionCookie();
    const sessionId = await this.getSessionId();
    return !!(cookie && sessionId);
  }

  // ── token refresh ─────────────────────────────────────────────────────────

  /**
   * Returns a fresh Clerk JWT by POSTing to the Clerk FAPI tokens endpoint
   * using the stored __session cookie value.
   */
  async getFreshToken(): Promise<string> {
    const sessionCookie = await this.getSessionCookie();
    const sessionId = await this.getSessionId();
    const clientUat = await this.getClientUat();
    const extraCookies = await this.getExtraCookies();

    if (!sessionCookie || !sessionId) {
      throw new Error(
        'No Clerk session stored. Run:\n' +
        '  huntr config set-session <__session-cookie-value>\n' +
        'See "huntr config set-session --help" for instructions.',
      );
    }

    return this.fetchToken(sessionCookie, sessionId, clientUat, extraCookies);
  }

  async refreshFromProvidedSession(
    sessionCookieValue: string,
    sessionId: string,
    clientUat?: string | null,
    extraCookies?: Record<string, string>,
  ): Promise<string> {
    return this.fetchToken(sessionCookieValue, sessionId, clientUat, extraCookies);
  }

  private fetchToken(
    sessionCookieValue: string,
    sessionId: string,
    clientUat?: string | null,
    extraCookies: Record<string, string> = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Match the exact request Clerk JS makes (version pinned to what huntr.co loads)
      const path = `/v1/client/sessions/${sessionId}/tokens?_clerk_js_version=4.73.14`;
      // Strip any "__session=" prefix if user pasted it with the name
      const raw = sessionCookieValue.startsWith('__session=')
        ? sessionCookieValue.slice('__session='.length)
        : sessionCookieValue;
      // Send all cookies Clerk expects, matching browser credentials:include behaviour
      const uat = clientUat && clientUat.trim() ? clientUat.trim() : '1';
      const cookieParts = [`__session=${raw}`, `__client_uat=${uat}`];
      for (const [name, value] of Object.entries(extraCookies)) {
        if (!value || name === '__session' || name === '__client_uat') continue;
        if (!/^[A-Za-z0-9_.-]+$/.test(name)) continue;
        cookieParts.push(`${name}=${value}`);
      }
      const cookieHeader = cookieParts.join('; ');

      const options = {
        hostname: CLERK_HOST,
        path,
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': '0',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
          'Origin': 'https://huntr.co',
          'Referer': 'https://huntr.co/',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', async () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              const data = JSON.parse(body);
              // Clerk FAPI response: { object: 'token', jwt: '...' }
                const token = data.jwt ?? data.token ?? data.object?.jwt;
                if (!token) {
                  reject(new Error(`Unexpected Clerk response: ${body.substring(0, 300)}`));
                } else {
                  // Clerk may rotate __session on refresh via Set-Cookie.
                  // Persisting it prevents "works once, fails later" behavior.
                  await this.persistRotatedSessionCookie(res.headers['set-cookie'], sessionId, raw, uat, extraCookies);
                  resolve(token as string);
                }
            } catch {
              reject(new Error(`Failed to parse Clerk response: ${body.substring(0, 300)}`));
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            reject(new Error(
              `Clerk session expired or invalid (HTTP ${res.statusCode}).\n` +
              'Re-extract your __session cookie from the browser:\n' +
              '  DevTools → Application → Cookies → https://huntr.co → __session → Value\n' +
              'Then run: huntr config set-session <new-value>',
            ));
          } else {
            reject(new Error(
              `Clerk token refresh failed: HTTP ${res.statusCode}\n${body.substring(0, 300)}`,
            ));
          }
        });
      });

      req.on('error', (err: Error) =>
        reject(new Error(`Network error refreshing token: ${err.message}`)),
      );
      req.end();
    });
  }

  private async persistRotatedSessionCookie(
    setCookie: string | string[] | undefined,
    sessionId: string,
    currentSessionCookie: string,
    clientUat?: string,
    extraCookies: Record<string, string> = {},
  ): Promise<void> {
    if (!setCookie) return;
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    let sessionCookie: string = currentSessionCookie;
    let rotatedUat = clientUat;
    const rotatedExtras: Record<string, string> = { ...extraCookies };

    for (const header of cookies) {
      const firstPair = header.split(';', 1)[0] ?? '';
      const idx = firstPair.indexOf('=');
      if (idx <= 0) continue;
      const name = firstPair.slice(0, idx);
      const value = firstPair.slice(idx + 1);
      if (!value) continue;

      if (name === '__session') {
        sessionCookie = value;
      } else if (name === '__client_uat') {
        rotatedUat = value;
      } else if (/^[A-Za-z0-9_.-]+$/.test(name)) {
        rotatedExtras[name] = value;
      }
    }

    await this.saveSession(sessionCookie, sessionId, rotatedUat, rotatedExtras);
  }

  // ── session-id extraction ─────────────────────────────────────────────────

  /**
   * Extracts the Clerk session ID (sess_...) from a __session JWT value.
   * The __session cookie value IS a JWT; its payload contains `sid`.
   */
  static extractSessionId(sessionJwt: string): string | null {
    try {
      const raw = sessionJwt.startsWith('__session=')
        ? sessionJwt.slice('__session='.length)
        : sessionJwt;

      const parts = raw.split('.');
      if (parts.length < 2) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      const sid = payload.sid ?? payload.session_id;
      if (typeof sid === 'string' && sid.startsWith('sess_')) return sid;
    } catch {
      // fall through
    }
    return null;
  }
}
