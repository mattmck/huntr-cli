import { createClient, TokenProvider } from '../client';
import { PersonalUserApi } from './user';
import { PersonalBoardsApi } from './boards';
import { PersonalJobsApi } from './jobs';
import { PersonalActionsApi } from './activities';

export class HuntrPersonalApi {
  public user: PersonalUserApi;
  public boards: PersonalBoardsApi;
  public jobs: PersonalJobsApi;
  public actions: PersonalActionsApi;

  constructor(tokenProvider: TokenProvider) {
    const client = createClient(tokenProvider, 'https://api.huntr.co/api');
    this.user = new PersonalUserApi(client);
    this.boards = new PersonalBoardsApi(client);
    this.jobs = new PersonalJobsApi(client);
    this.actions = new PersonalActionsApi(client);
  }
}

export * from './user';
export * from './boards';
export * from './jobs';
export * from './activities';
