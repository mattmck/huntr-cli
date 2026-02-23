import fs from 'fs';
import path from 'path';
import os from 'os';

export interface HuntrConfig {
  apiToken?: string;
  api?: {
    boardsPath?: '/boards' | '/board';
    boardsShape?: 'array' | 'dataArray' | 'map';
  };
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

  getBoardsApiPrefs(): { path?: '/boards' | '/board'; shape?: 'array' | 'dataArray' | 'map' } {
    const cfg = this.getConfig();
    return { path: cfg.api?.boardsPath, shape: cfg.api?.boardsShape };
  }

  setBoardsApiPrefs(prefs: { path: '/boards' | '/board'; shape: 'array' | 'dataArray' | 'map' }): void {
    const cfg = this.getConfig();
    cfg.api = cfg.api ?? {};
    cfg.api.boardsPath = prefs.path;
    cfg.api.boardsShape = prefs.shape;
    this.setConfig(cfg);
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
