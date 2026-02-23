import { describe, it, expect } from 'vitest';
import { PersonalBoardsApi } from '../src/api/personal/boards';
import { PersonalUserApi } from '../src/api/personal/user';

class FakeClient {
  public lastPath: string | null = null;
  async get<T>(path: string): Promise<any> {
    this.lastPath = path;
    // Return shapes expected by parsers
    if (path === '/user/boards') return [{ id: 'b1', _id: 'b1', name: 'Board', createdAt: new Date().toISOString() }];
    if (path === '/user') return { id: 'u1', email: 'user@example.com', createdAt: new Date().toISOString() };
    return {};
  }
}

describe('API endpoints', () => {
  it('uses /api/user/boards for boards list', async () => {
    const client = new FakeClient() as any;
    const api = new PersonalBoardsApi(client);
    const boards = await api.list();
    expect(boards.length).toBeGreaterThan(0);
    expect((client as any).lastPath).toBe('/user/boards');
  });

  it('uses /api/user for profile', async () => {
    const client = new FakeClient() as any;
    const api = new PersonalUserApi(client);
    const user = await api.getProfile();
    expect(user.email).toBe('user@example.com');
    expect((client as any).lastPath).toBe('/user');
  });
});