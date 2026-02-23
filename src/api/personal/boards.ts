import { HuntrApiClient } from '../client';
import { Board } from '../../types/personal';

export class PersonalBoardsApi {
  constructor(private client: HuntrApiClient) {}

  async list(): Promise<Board[]> {
    // Official endpoint: /api/user/boards returns an array of boards
    const res = await this.client.get<unknown>('/user/boards');
    if (Array.isArray(res)) return res as Board[];
    if (res && typeof res === 'object' && Array.isArray((res as any).data)) return (res as any).data as Board[];
    // Fallback if API returns an object map
    if (res && typeof res === 'object') return Object.values(res as Record<string, Board>);
    return [];
  }

  async get(boardId: string): Promise<Board> {
    // There isn't a documented /api/user/boards/:id; use /api/boards/:id if needed
    return this.client.get<Board>(`/boards/${boardId}`);
  }
}
