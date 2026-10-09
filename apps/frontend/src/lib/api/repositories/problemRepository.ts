import { API_ROUTES } from '@ocj/contracts';
import type {
  IProblem,
  ProblemListQuery,
  ProblemListItem,
  CreateProblemRequest,
  UpdateProblemRequest,
  ITestcase,
  TestcaseImportResult,
  TestcaseActivationResult,
  TestcaseSetSummary,
  PaginatedResult,
} from '@ocj/contracts';
import type { ApiResponse } from '../types';
import { HttpClient } from '../httpClient';

export class ProblemRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  getProblems(query?: ProblemListQuery): Promise<PaginatedResult<ProblemListItem>> {
    const params = query ? this.buildQueryString(query) : '';
    const path = params ? `${API_ROUTES.PROBLEMS}?${params}` : API_ROUTES.PROBLEMS;
    return this.http.request('GET', path);
  }

  getProblem(slug: string): Promise<IProblem> {
    return this.http.request('GET', `${API_ROUTES.PROBLEMS}/${slug}`);
  }

  createProblem(data: CreateProblemRequest): Promise<IProblem> {
    return this.http.request('POST', API_ROUTES.PROBLEMS, { body: data });
  }

  updateProblem(id: string, data: UpdateProblemRequest): Promise<IProblem> {
    return this.http.request('PUT', `${API_ROUTES.PROBLEMS}/${id}`, { body: data });
  }

  deleteProblem(id: string): Promise<ApiResponse<void>> {
    return this.http.request('DELETE', `${API_ROUTES.PROBLEMS}/${id}`);
  }

  getTestcases(problemId: string, isExample?: boolean): Promise<ITestcase[]> {
    const query = isExample !== undefined ? `?example=${isExample}` : '';
    return this.http.request('GET', `${API_ROUTES.PROBLEMS}/${problemId}/testcases${query}`);
  }

  createTestcase(problemId: string, data: Record<string, unknown>): Promise<ITestcase> {
    return this.http.request('POST', `${API_ROUTES.PROBLEMS}/${problemId}/testcases`, { body: data });
  }

  deleteTestcase(problemId: string, testcaseId: string): Promise<ApiResponse<void>> {
    return this.http.request('DELETE', `${API_ROUTES.PROBLEMS}/${problemId}/testcases/${testcaseId}`);
  }

  getTestcaseSets(problemId: string, query?: { page?: number; limit?: number }): Promise<PaginatedResult<TestcaseSetSummary>> {
    const params = query ? this.buildQueryString(query) : '';
    const path = `${API_ROUTES.PROBLEMS}/${problemId}/testcase-sets`;
    return this.http.request('GET', params ? `${path}?${params}` : path);
  }

  importTestcaseSet(problemId: string, file: File): Promise<TestcaseImportResult> {
    const form = new FormData();
    form.append('archive', file);
    return this.http.request('POST', `${API_ROUTES.PROBLEMS}/${problemId}/testcase-sets/import`, { body: form });
  }

  activateTestcaseSet(problemId: string, testcaseSetId: string): Promise<TestcaseActivationResult> {
    return this.http.request('POST', `${API_ROUTES.PROBLEMS}/${problemId}/testcase-sets/${testcaseSetId}/activate`);
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
