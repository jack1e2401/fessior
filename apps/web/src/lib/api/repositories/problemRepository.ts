import { API_ROUTES } from '@ocj/contracts';
import type {
  IProblem,
  ISubmission,
  ProblemListQuery,
  CreateProblemRequest,
  UpdateProblemRequest,
} from '@ocj/contracts';
import type { ApiResponse } from '../types';
import { HttpClient } from '../httpClient';

export class ProblemRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  getProblems(query?: ProblemListQuery): Promise<ApiResponse<IProblem[]>> {
    const params = query ? this.buildQueryString(query) : '';
    const path = params ? `${API_ROUTES.PROBLEMS}?${params}` : API_ROUTES.PROBLEMS;
    return this.http.request('GET', path);
  }

  getProblem(slug: string): Promise<ApiResponse<IProblem>> {
    return this.http.request('GET', `${API_ROUTES.PROBLEMS}/${slug}`);
  }

  createProblem(data: CreateProblemRequest): Promise<ApiResponse<IProblem>> {
    return this.http.request('POST', API_ROUTES.PROBLEMS, { body: data });
  }

  updateProblem(id: string, data: UpdateProblemRequest): Promise<ApiResponse<IProblem>> {
    return this.http.request('PUT', `${API_ROUTES.PROBLEMS}/${id}`, { body: data });
  }

  deleteProblem(id: string): Promise<ApiResponse<void>> {
    return this.http.request('DELETE', `${API_ROUTES.PROBLEMS}/${id}`);
  }

  getTestcases(problemId: string, isExample?: boolean): Promise<ApiResponse<ISubmission[]>> {
    const query = isExample !== undefined ? `?example=${isExample}` : '';
    return this.http.request('GET', `${API_ROUTES.PROBLEMS}/${problemId}/testcases${query}`);
  }

  createTestcase(problemId: string, data: Record<string, unknown>): Promise<ApiResponse<ISubmission>> {
    return this.http.request('POST', `${API_ROUTES.PROBLEMS}/${problemId}/testcases`, { body: data });
  }

  deleteTestcase(problemId: string, testcaseId: string): Promise<ApiResponse<void>> {
    return this.http.request('DELETE', `${API_ROUTES.PROBLEMS}/${problemId}/testcases/${testcaseId}`);
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
