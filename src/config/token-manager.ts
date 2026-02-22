import { password } from '@inquirer/prompts';
import { ConfigManager } from './config-manager';
import { KeychainManager } from './keychain-manager';

export interface TokenOptions {
  token?: string;
  usePrompt?: boolean;
}

export class TokenManager {
  private configManager: ConfigManager;
  private keychainManager: KeychainManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.keychainManager = new KeychainManager();
  }

  /**
   * Get token with fallback chain:
   * 1. CLI argument (passed via options)
   * 2. Environment variable (HUNTR_API_TOKEN)
   * 3. Config file (~/.huntr/config.json)
   * 4. macOS Keychain
   * 5. Interactive prompt (if usePrompt is true)
   */
  async getToken(options: TokenOptions = {}): Promise<string> {
    // 1. Check CLI argument
    if (options.token) {
      return options.token;
    }

    // 2. Check environment variable
    const envToken = process.env.HUNTR_API_TOKEN;
    if (envToken) {
      return envToken;
    }

    // 3. Check config file
    const configToken = this.configManager.getToken();
    if (configToken) {
      return configToken;
    }

    // 4. Check keychain
    const keychainToken = await this.keychainManager.getToken();
    if (keychainToken) {
      return keychainToken;
    }

    // 5. Prompt user if allowed
    if (options.usePrompt !== false) {
      const promptedToken = await password({
        message: 'Enter your Huntr API token:',
        mask: '*',
      });

      if (promptedToken) {
        // Ask if they want to save it
        const saveChoice = await this.promptSaveLocation();
        if (saveChoice !== 'none') {
          await this.saveToken(promptedToken, saveChoice);
        }
        return promptedToken;
      }
    }

    throw new Error(
      'HUNTR_API_TOKEN not found. Please provide it via:\n' +
      '  - Command line: --token <token>\n' +
      '  - Environment variable: HUNTR_API_TOKEN\n' +
      '  - Config file: huntr config set-token <token>\n' +
      '  - Keychain: huntr config set-token --keychain <token>'
    );
  }

  private async promptSaveLocation(): Promise<'config' | 'keychain' | 'none'> {
    const { select } = await import('@inquirer/prompts');
    
    const choices = [
      { name: 'Save to config file (~/.huntr/config.json)', value: 'config' as const },
      { name: 'Save to macOS Keychain (secure)', value: 'keychain' as const },
      { name: 'Do not save (enter each time)', value: 'none' as const },
    ];

    return await select({
      message: 'Where would you like to save this token?',
      choices,
    }) as 'config' | 'keychain' | 'none';
  }

  async saveToken(token: string, location: 'config' | 'keychain'): Promise<void> {
    if (location === 'config') {
      this.configManager.setToken(token);
    } else if (location === 'keychain') {
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
  }> {
    return {
      env: !!process.env.HUNTR_API_TOKEN,
      config: !!this.configManager.getToken(),
      keychain: !!(await this.keychainManager.getToken()),
    };
  }
}
