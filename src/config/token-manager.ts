import { password } from '@inquirer/prompts';
import { ConfigManager } from './config-manager';
import { KeychainManager } from './keychain-manager';
import { ClerkSessionManager } from './clerk-session-manager';
import type { TokenProvider } from '../api/client';

export interface TokenOptions {
  token?: string;
  usePrompt?: boolean;
}

export class TokenManager {
  private configManager: ConfigManager;
  private keychainManager: KeychainManager;
  readonly clerkSession: ClerkSessionManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.keychainManager = new KeychainManager();
    this.clerkSession = new ClerkSessionManager();
  }

  /**
   * Returns a TokenProvider for use with HuntrPersonalApi.
   *
   * Resolution order:
   *   1. CLI --token argument (static, passed via options)
   *   2. HUNTR_API_TOKEN env var (static)
   *   3. Stored Clerk session cookie → auto-refresh on every call
   *   4. Static token from config file or keychain
   *   5. Interactive prompt
   */
  async getTokenProvider(options: TokenOptions = {}): Promise<TokenProvider> {
    // 1. CLI argument — static token
    if (options.token) {
      return options.token;
    }

    // 2. Environment variable — static token
    const envToken = process.env.HUNTR_API_TOKEN;
    if (envToken) {
      return envToken;
    }

    // 3. Clerk session — dynamic refresh
    if (await this.clerkSession.hasSession()) {
      return () => this.clerkSession.getFreshToken();
    }

    // 4. Static token from config or keychain
    const configToken = this.configManager.getToken();
    if (configToken) return configToken;

    const keychainToken = await this.keychainManager.getToken();
    if (keychainToken) return keychainToken;

    // 5. Interactive prompt — static token (short-lived, but usable)
    if (options.usePrompt !== false) {
      const promptedToken = await password({
        message: 'Enter your Huntr API token:',
        mask: '*',
      });

      if (promptedToken) {
        const saveChoice = await this.promptSaveLocation();
        if (saveChoice !== 'none') {
          await this.saveToken(promptedToken, saveChoice);
        }
        return promptedToken;
      }
    }

    throw new Error(
      'No Huntr credentials found. Options:\n' +
      '  • Clerk session (recommended): huntr config set-session <__session-cookie>\n' +
      '  • Static token:                huntr config set-token <token> [--keychain]\n' +
      '  • CLI flag:                    huntr --token <token> <command>\n' +
      '  • Environment:                 HUNTR_API_TOKEN=<token> huntr <command>',
    );
  }

  /**
   * Legacy helper — returns a resolved static token string.
   * Use getTokenProvider() for new code so session refresh works.
   */
  async getToken(options: TokenOptions = {}): Promise<string> {
    if (options.token) return options.token;
    const envToken = process.env.HUNTR_API_TOKEN;
    if (envToken) return envToken;
    const configToken = this.configManager.getToken();
    if (configToken) return configToken;
    const keychainToken = await this.keychainManager.getToken();
    if (keychainToken) return keychainToken;
    throw new Error('No static token found. Try huntr config set-token or set-session.');
  }

  private async promptSaveLocation(): Promise<'config' | 'keychain' | 'none'> {
    const { select } = await import('@inquirer/prompts');
    return await select({
      message: 'Where would you like to save this token?',
      choices: [
        { name: 'Save to config file (~/.huntr/config.json)', value: 'config' as const },
        { name: 'Save to macOS Keychain (secure)', value: 'keychain' as const },
        { name: 'Do not save (enter each time)', value: 'none' as const },
      ],
    }) as 'config' | 'keychain' | 'none';
  }

  async saveToken(token: string, location: 'config' | 'keychain'): Promise<void> {
    if (location === 'config') {
      this.configManager.setToken(token);
    } else {
      await this.keychainManager.setToken(token);
    }
  }

  async clearToken(location?: 'config' | 'keychain' | 'all'): Promise<void> {
    if (!location || location === 'all' || location === 'config') {
      this.configManager.clearToken();
    }
    if (!location || location === 'all' || location === 'keychain') {
      await this.keychainManager.deleteToken();
    }
  }

  async showTokenSources(): Promise<{
    env: boolean;
    config: boolean;
    keychain: boolean;
    clerkSession: boolean;
  }> {
    return {
      env: !!process.env.HUNTR_API_TOKEN,
      config: !!this.configManager.getToken(),
      keychain: !!(await this.keychainManager.getToken()),
      clerkSession: await this.clerkSession.hasSession(),
    };
  }
}
