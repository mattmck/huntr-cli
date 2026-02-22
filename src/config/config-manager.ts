import fs from 'fs';
import path from 'path';
import os from 'os';

export interface HuntrConfig {
  apiToken?: string;
}

export class ConfigManager {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.huntr');
    this.configPath = path.join(this.configDir, 'config.json');
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  getConfig(): HuntrConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      // Return empty config if file doesn't exist or is invalid
    }
    return {};
  }

  setConfig(config: HuntrConfig): void {
    this.ensureConfigDir();
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  getToken(): string | undefined {
    return this.getConfig().apiToken;
  }

  setToken(token: string): void {
    const config = this.getConfig();
    config.apiToken = token;
    this.setConfig(config);
  }

  clearToken(): void {
    const config = this.getConfig();
    delete config.apiToken;
    this.setConfig(config);
  }
}
