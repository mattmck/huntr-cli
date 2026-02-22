import axios, { AxiosInstance, AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class HuntrApiClient {
  private client: AxiosInstance;
  private baseURL = 'https://api.huntr.co/org';

  constructor(apiToken?: string) {
    const token = apiToken || process.env.HUNTR_API_TOKEN;
    
    if (!token) {
      throw new Error('HUNTR_API_TOKEN is required. Set it in .env file or pass it to the constructor.');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.data) {
          const apiError = error.response.data as any;
          throw new Error(apiError.error?.message || 'API request failed');
        }
        throw error;
      }
    );
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint);
    return response.data;
  }

  async *paginate<T>(
    endpoint: string,
    params: Record<string, any> = {},
    limit: number = 100
  ): AsyncGenerator<T[], void, undefined> {
    let next: string | undefined = undefined;

    do {
      const queryParams: Record<string, any> = { ...params, limit };
      if (next) {
        queryParams.next = next;
      }

      const response = await this.get<{ data: T[]; next?: string }>(endpoint, queryParams);
      yield response.data;
      next = response.next;
    } while (next);
  }
}

export const createClient = (apiToken?: string): HuntrApiClient => {
  return new HuntrApiClient(apiToken);
};
