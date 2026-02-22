import keytar from 'keytar';

const SERVICE_NAME = 'huntr-cli';
const ACCOUNT_NAME = 'api-token';

export class KeychainManager {
  async getToken(): Promise<string | null> {
    try {
      return await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
    } catch (error) {
      throw new Error('Failed to save token to keychain');
    }
  }

  async deleteToken(): Promise<boolean> {
    try {
      return await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      return false;
    }
  }
}
