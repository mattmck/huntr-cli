import { HuntrApiClient } from './client';
import { Tag, PaginatedResponse } from '../types';

export class TagsApi {
  constructor(private client: HuntrApiClient) {}

  async list(params?: { limit?: number; next?: string }): Promise<PaginatedResponse<Tag>> {
    return this.client.get<PaginatedResponse<Tag>>('/tags', params);
  }

  async create(name: string, targetObject?: string): Promise<Tag> {
    return this.client.post<Tag>('/tags', { name, targetObject });
  }

  async *listAll(limit: number = 100): AsyncGenerator<Tag[], void, undefined> {
    yield* this.client.paginate<Tag>('/tags', {}, limit);
  }
}
