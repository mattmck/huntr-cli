import axios, { AxiosInstance, AxiosError } from 'axios';

// Note: We do not auto-load .env to avoid noisy logs.
// If you want .env loaded, run with HUNTR_LOAD_ENV=true and we will load it explicitly.
import dotenv from 'dotenv';
if (process.env.HUNTR_LOAD_ENV === 'true') {
  dotenv.config({ debug: false });
}

/** A static token string OR an async function that returns a fresh token. */
export type TokenProvider = string | (() => Promise<string>);

export class HuntrApiClient {
  private axiosInstance: AxiosInstance;
  private tokenProvider: () => Promise<string>;

  constructor(tokenProvider: TokenProvider, baseURL: string = 'https://api.huntr.co/org') {
    this.tokenProvider =
      typeof tokenProvider === 'string'
        ? async () => tokenProvider
        : tokenProvider;

    this.axiosInstance = axios.create({ baseURL });

    // Inject a fresh Authorization header before every request
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.tokenProvider();
      if (!token) throw new Error('No API token available.');
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json';
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const apiError = error.response.data as any;
          const message = apiError?.error?.message ?? apiError?.message ?? 'API request failed';
          throw new Error(`HTTP ${status}: ${message}`);
        }
        if (error.request) {
          throw new Error('No response from API - check your network connection');
        }
        throw error;
      },
    );
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint);
    return response.data;
  }

  async *paginate<T>(
    endpoint: string,
    params: Record<string, any> = {},
    limit: number = 100,
  ): AsyncGenerator<T[], void, undefined> {
    let next: string | undefined = undefined;

    do {
      const queryParams: Record<string, any> = { ...params, limit };
      if (next) queryParams.next = next;
      const response = await this.get<{ data: T[]; next?: string }>(endpoint, queryParams);
      yield response.data;
      next = response.next;
    } while (next);
  }
}

export const createClient = (tokenProvider: TokenProvider, baseURL?: string): HuntrApiClient => {
  return new HuntrApiClient(tokenProvider, baseURL);
};
