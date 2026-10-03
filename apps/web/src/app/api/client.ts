import {
  AuthRepository,
  HttpClient,
  ProblemRepository,
  SubmissionRepository,
  UserRepository,
  MatchRepository,
} from '../../lib/api/index';
import { useAuthStore } from '../../features/auth/auth.store';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:6868/api/v1';

export const httpClient = new HttpClient({
  baseUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().clear(),
});

// ── Repositories ──
export const authRepository = new AuthRepository(httpClient);
export const problemRepository = new ProblemRepository(httpClient);
export const submissionRepository = new SubmissionRepository(httpClient);
export const userRepository = new UserRepository(httpClient);
export const matchRepository = new MatchRepository(httpClient);
