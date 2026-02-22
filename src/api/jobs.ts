import { HuntrApiClient } from './client';
import { Job, PaginatedResponse } from '../types';

export class JobsApi {
  constructor(private client: HuntrApiClient) {}

  async list(params?: { 
    limit?: number; 
    next?: string;
    member_id?: string;
  }): Promise<PaginatedResponse<Job>> {
    return this.client.get<PaginatedResponse<Job>>('/jobs', params);
  }

  async get(id: string): Promise<Job> {
    return this.client.get<Job>(`/jobs/${id}`);
  }

  async *listAll(
    memberId?: string,
    limit: number = 100
  ): AsyncGenerator<Job[], void, undefined> {
    const params = memberId ? { member_id: memberId } : {};
    yield* this.client.paginate<Job>('/jobs', params, limit);
  }
}
