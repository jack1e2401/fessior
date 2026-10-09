import { API_ROUTES } from '@ocj/contracts';
import type {
  AdminSubmissionListQuery,
  AdminSubmissionSummary,
  ISubmission,
  SubmitCodeRequest,
  RunCodeRequest,
  SubmissionListQuery,
} from '@ocj/contracts';
import type { PaginatedResult } from '@ocj/contracts';
import type { ApiResponse } from '../types';
import { HttpClient } from '../httpClient';

export class SubmissionRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  submit(data: SubmitCodeRequest): Promise<ApiResponse<ISubmission>> {
    return this.http.request('POST', `${API_ROUTES.SUBMISSIONS}`, { body: data });
  }

  run(data: RunCodeRequest): Promise<ApiResponse<ISubmission>> {
    return this.http.request('POST', `${API_ROUTES.SUBMISSIONS}/run`, { body: data });
  }

  getSubmissions(query?: SubmissionListQuery): Promise<ApiResponse<any>> {
    const params = query ? this.buildQueryString(query) : '';
    const path = params ? `${API_ROUTES.SUBMISSIONS}?${params}` : API_ROUTES.SUBMISSIONS;
    return this.http.request('GET', path);
  }

  getSubmission(id: string): Promise<ISubmission> {
    return this.http.request('GET', `${API_ROUTES.SUBMISSIONS}/${id}`);
  }

  getAdminSubmissions(query: AdminSubmissionListQuery = {}): Promise<PaginatedResult<AdminSubmissionSummary>> {
    const params = this.buildQueryString(query);
    const path = params ? `${API_ROUTES.SUBMISSIONS}/admin?${params}` : `${API_ROUTES.SUBMISSIONS}/admin`;
    return this.http.request('GET', path);
  }

  private buildQueryString(query: any): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.join('&');
  }
}
