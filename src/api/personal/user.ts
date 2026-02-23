import { HuntrApiClient } from '../client';
import { UserProfile } from '../../types/personal';

export class PersonalUserApi {
  constructor(private client: HuntrApiClient) {}

  async getProfile(): Promise<UserProfile> {
    // Official endpoint returns the current user's profile
    return this.client.get<UserProfile>('/user');
  }
}
