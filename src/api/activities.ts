import { HuntrApiClient } from './client';
import { Activity, PaginatedResponse } from '../types';

export class ActivitiesApi {
  constructor(private client: HuntrApiClient) {}

  async list(params?: {
    limit?: number;
    next?: string;
    member_id?: string;
  }): Promise<PaginatedResponse<Activity>> {
    return this.client.get<PaginatedResponse<Activity>>('/activities', params);
  }

  async *listAll(
    memberId?: string,
    limit: number = 100
  ): AsyncGenerator<Activity[], void, undefined> {
    const params = memberId ? { member_id: memberId } : {};
    yield* this.client.paginate<Activity>('/activities', params, limit);
  }
}
