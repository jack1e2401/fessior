/**
 * Bridge file — preserves the old `api` object shape using app-local repositories.
 *
 * Maps repository calls → old `{ success, data }` format.
 * This file exists to avoid breaking 30+ legacy components during Phase 1-2 migration.
 * Will be removed once all views are refactored to use React Query + repositories directly.
 *
 * NOTE: HttpClient unwraps `{ status, data }` → returns `data` directly on success,
 *       and throws ApiError on failure. Our `wrap()` catches errors → `{ success: false }`.
 */

import {
  httpClient,
  problemRepository,
  submissionRepository,
  matchRepository,
  userRepository,
} from '../app/api/client';

// ── Helper: try/catch repository call → { success, data } ──
 
async function wrap<T>(promise: Promise<any>): Promise<{ success: boolean; data: T | undefined }> {
  try {
    // Repositories return unwrapped data (HttpClient extracts .data), or throw ApiError
    const data = (await promise) as T;
    return { success: true, data };
  } catch {
    return { success: false, data: undefined };
  }
}

// ── Raw HTTP helpers (for endpoints not yet in repositories) ──
async function rawGet<T>(path: string) {
  return wrap<T>(httpClient.request('GET', path));
}
async function rawPost<T>(path: string, body?: unknown) {
  return wrap<T>(httpClient.request('POST', path, { body }));
}

async function rawDelete(path: string) {
  return wrap<void>(httpClient.request('DELETE', path));
}

// ── API object ──
export const api = {
  // =========================================================
  // Auth & User
  // =========================================================
   
  getMe: () => wrap<any>(userRepository.getProfile('me')),
   
  getCurrentUser: () => wrap<any>(userRepository.getProfile('me')),
   
  getSessions: () => rawGet<any>('/auth/sessions'),
  revokeSession: (sessionId: string) => rawDelete(`/auth/sessions/${sessionId}`),
  revokeAllSessions: () => rawDelete('/auth/sessions'),
   
  updateProfile: (data: Record<string, unknown>) => wrap<any>(userRepository.updateProfile(data)),
  
  // Public Profile
  getUserProfile: (username: string) => rawGet<any>(`/users/profile/${username}`),
  getUserProfileSubmissions: (username: string) => rawGet<any>(`/users/profile/${username}/submissions`),
  getUserProfileTagStats: (username: string) => rawGet<any>(`/users/profile/${username}/tag-stats`),
  getUserProfileEloHistory: (username: string) => rawGet<any>(`/users/profile/${username}/elo-history`),
  getUserProfileStreak: (username: string) => rawGet<any>(`/users/profile/${username}/streak`),

  // =========================================================
  // Problems
  // =========================================================
   
  getProblems: () => wrap<any>(problemRepository.getProblems()),
   
  getProblemDetail: (slug: string) => wrap<any>(problemRepository.getProblem(slug)),
   
  getProblemTags: () => wrap<any>(problemRepository.getTags()),
  createProblem: (data: Record<string, unknown>) =>
     
    wrap<any>(problemRepository.createProblem(data as never)),
  updateProblem: (id: string, data: Record<string, unknown>) =>
     
    wrap<any>(problemRepository.updateProblem(id, data as never)),
  deleteProblem: (id: string) => wrap(problemRepository.deleteProblem(id)),

  // Tag management (admin)
   
  createTag: (data: Record<string, unknown>) => rawPost<any>('/problems/tags', data),

  // Testcase management
   
  getTestcases: (problemId: string, isExample?: boolean) => wrap<any>(problemRepository.getTestcases(problemId, isExample)),
  addTestcase: (problemId: string, data: Record<string, unknown>) =>
     
    wrap<any>(problemRepository.createTestcase(problemId, data)),
  deleteTestcase: (problemId: string, testcaseId: string) =>
    wrap(problemRepository.deleteTestcase(problemId, testcaseId)),

  // =========================================================
  // Submissions
  // =========================================================
  submitCode: (data: any) =>
     
    wrap<any>(submissionRepository.submit(data)),
  runCode: (data: any) =>
     
    wrap<any>(submissionRepository.run(data)),
   
  getSubmissionDetail: (id: string) => wrap<any>(submissionRepository.getSubmission(id)),
  getSubmissions: (params?: Record<string, unknown>) =>
     
    wrap<any>(submissionRepository.getSubmissions(params as never)),

  // =========================================================
  // Match
  // =========================================================
   
  getMatchHistory: () => wrap<any>(matchRepository.getMatches()),
   
  getActiveMatch: () => rawGet<any>('/matches/active'),
   
  getMatchDetails: (id: string) => wrap<any>(matchRepository.getMatch(id)),
  deleteMatch: (id: string) => rawDelete(`/matches/${id}`),
};

export default api;
