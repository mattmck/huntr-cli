import { HuntrApiClient } from '../client';
import { UserProfile } from '../../types/personal';

export class PersonalUserApi {
  constructor(private client: HuntrApiClient) {}

  async getProfile(): Promise<UserProfile> {
    return this.client.get<UserProfile>('/me');
  }
}
