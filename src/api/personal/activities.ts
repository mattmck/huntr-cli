import { HuntrApiClient } from '../client';
import { PersonalAction, PersonalJob, PersonalJobsResponse } from '../../types/personal';

export class PersonalActionsApi {
  constructor(private client: HuntrApiClient) {}

  // Returns object map { [actionId]: PersonalAction }
  async listByBoard(boardId: string): Promise<Record<string, PersonalAction>> {
    return this.client.get<Record<string, PersonalAction>>(`/board/${boardId}/actions`);
  }

  // Returns flattened array sorted by date desc, optionally filtered by action types
  async listByBoardFlat(
    boardId: string,
    opts?: { since?: Date; types?: string[] },
  ): Promise<PersonalAction[]> {
    const raw = await this.listByBoard(boardId);
    let actions = Object.values(raw);

    if (opts?.since) {
      const cutoff = opts.since.getTime();
      actions = actions.filter(a => new Date(a.date || a.createdAt).getTime() >= cutoff);
    }

    if (opts?.types && opts.types.length > 0) {
      actions = actions.filter(a => opts.types!.includes(a.actionType));
    }

    return actions.sort((a, b) =>
      new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime(),
    );
  }

  // Joins actions with job data to produce enriched rows
  async weekSummary(boardId: string): Promise<Array<{
    date: string;
    actionType: string;
    company: string;
    jobTitle: string;
    status: string;
    url: string;
    address: string;
  }>> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [actions, jobsResponse] = await Promise.all([
      this.listByBoardFlat(boardId, { since }),
      this.client.get<PersonalJobsResponse>(`/board/${boardId}/jobs`),
    ]);

    const jobs = jobsResponse.jobs;

    return actions
      .filter(a => a.actionType !== 'ACTIVITY_CREATED')
      .map(a => {
        const jobId = a.data?._job;
        const job: PersonalJob | undefined = jobId ? jobs[jobId] : undefined;
        return {
          date: new Date(a.date || a.createdAt).toISOString().substring(0, 16),
          actionType: a.actionType,
          company: a.data?.company?.name ?? '',
          jobTitle: a.data?.job?.title ?? '',
          status: a.data?.toList?.name ?? '',
          url: job?.url ?? '',
          address: job?.location?.address ?? '',
        };
      });
  }
}
