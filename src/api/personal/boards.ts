import { HuntrApiClient } from '../client';
import { Board } from '../../types/personal';

export class PersonalBoardsApi {
  constructor(private client: HuntrApiClient) {}

  async list(): Promise<Board[]> {
    return this.client.get<Board[]>('/boards');
  }

  async get(boardId: string): Promise<Board> {
    return this.client.get<Board>(`/boards/${boardId}`);
  }
}
