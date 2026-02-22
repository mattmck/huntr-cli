import { HuntrApiClient } from './client';
import { Member, PaginatedResponse } from '../types';

export class MembersApi {
  constructor(private client: HuntrApiClient) {}

  async list(params?: { limit?: number; next?: string }): Promise<PaginatedResponse<Member>> {
    return this.client.get<PaginatedResponse<Member>>('/members', params);
  }

  async get(id: string): Promise<Member> {
    return this.client.get<Member>(`/members/${id}`);
  }

  async update(id: string, fieldId: string, value: string): Promise<void> {
    return this.client.put<void>(`/members/${id}/field-values/${fieldId}`, { value });
  }

  async *listAll(limit: number = 100): AsyncGenerator<Member[], void, undefined> {
    yield* this.client.paginate<Member>('/members', {}, limit);
  }
}
