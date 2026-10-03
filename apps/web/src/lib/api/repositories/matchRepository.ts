import { API_ROUTES } from '@ocj/contracts';
import type { IMatch } from '@ocj/contracts';
import type { ApiResponse } from '../types';
import { HttpClient } from '../httpClient';

export class MatchRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  getMatches(query?: Record<string, unknown>): Promise<ApiResponse<IMatch[]>> {
    const params = query ? this.buildQueryString(query) : '';
    const path = params ? `${API_ROUTES.MATCHES}/history?${params}` : `${API_ROUTES.MATCHES}/history`;
    return this.http.request('GET', path);
  }

  getMatch(id: string): Promise<ApiResponse<IMatch>> {
    return this.http.request('GET', `${API_ROUTES.MATCHES}/${id}`);
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
