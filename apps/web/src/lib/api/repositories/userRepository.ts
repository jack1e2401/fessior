import { API_ROUTES } from '@ocj/contracts';
import type { IUser, UserUpdateProfileRequest } from '@ocj/contracts';
import type { ApiResponse } from '../types';
import { HttpClient } from '../httpClient';

export class UserRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  getProfile(username: string): Promise<ApiResponse<IUser>> {
    return this.http.request('GET', `${API_ROUTES.USER}/profile/${username}`);
  }

  updateProfile(data: UserUpdateProfileRequest): Promise<ApiResponse<IUser>> {
    return this.http.request('PATCH', `${API_ROUTES.USER}/me`, { body: data });
  }

  getUserStats(userId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.http.request('GET', `${API_ROUTES.USER}/${userId}/stats`);
  }

  getUsers(query?: Record<string, unknown>): Promise<ApiResponse<IUser[]>> {
    const params = query ? this.buildQueryString(query) : '';
    const path = params ? `${API_ROUTES.USER}?${params}` : API_ROUTES.USER;
    return this.http.request('GET', path);
  }

  private buildQueryString(query: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.join('&');
  }
}
