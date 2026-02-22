import { HuntrApiClient, createClient } from './client';
import { MembersApi } from './members';
import { JobsApi } from './jobs';
import { ActivitiesApi } from './activities';
import { TagsApi } from './tags';

export class HuntrApi {
  public members: MembersApi;
  public jobs: JobsApi;
  public activities: ActivitiesApi;
  public tags: TagsApi;

  constructor(apiToken: string) {
    const client = createClient(apiToken);
    this.members = new MembersApi(client);
    this.jobs = new JobsApi(client);
    this.activities = new ActivitiesApi(client);
    this.tags = new TagsApi(client);
  }
}

export * from './client';
export * from './members';
export * from './jobs';
export * from './activities';
export * from './tags';
