import { HuntrApiClient } from '../client';
import { Board, BoardList } from '../../types/personal';

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
    return this.client.get<Board>(`/board/${boardId}`);
  }

  // Returns a map of { [listId]: BoardList } for the given board
  async listsByBoard(boardId: string): Promise<Record<string, BoardList>> {
    return this.client.get<Record<string, BoardList>>(`/board/${boardId}/lists`);
  }
}
