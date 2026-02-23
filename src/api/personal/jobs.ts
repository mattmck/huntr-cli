import { HuntrApiClient } from '../client';
import { PersonalJob, PersonalJobsResponse } from '../../types/personal';

export class PersonalJobsApi {
  constructor(private client: HuntrApiClient) {}

  // API returns { jobs: { [id]: PersonalJob } } — an object map, not an array
  async listByBoard(boardId: string): Promise<PersonalJobsResponse> {
    return this.client.get<PersonalJobsResponse>(`/board/${boardId}/jobs`);
  }

  // Convenience: returns flat array
  async listByBoardFlat(boardId: string): Promise<PersonalJob[]> {
    const response = await this.listByBoard(boardId);
    return Object.values(response.jobs);
  }

  async get(boardId: string, jobId: string): Promise<PersonalJob> {
    return this.client.get<PersonalJob>(`/board/${boardId}/jobs/${jobId}`);
  }

  async create(boardId: string, job: Partial<PersonalJob>): Promise<PersonalJob> {
    return this.client.post<PersonalJob>(`/board/${boardId}/jobs`, job);
  }

  async update(boardId: string, jobId: string, updates: Partial<PersonalJob>): Promise<PersonalJob> {
    return this.client.put<PersonalJob>(`/board/${boardId}/jobs/${jobId}`, updates);
  }

  async delete(boardId: string, jobId: string): Promise<void> {
    return this.client.delete<void>(`/board/${boardId}/jobs/${jobId}`);
  }
}
