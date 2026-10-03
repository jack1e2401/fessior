export const DEFAULT_LIMITS = {
  TIME_LIMIT_MS: 2000,
  MEMORY_LIMIT_MB: 256,
} as const;

export const SUPPORTED_LANGUAGES = ['cpp', 'java', 'python'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const SubmissionStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  ACCEPTED: 'ACCEPTED',
  WA: 'WA',
  TLE: 'TLE',
  MLE: 'MLE',
  RE: 'RE',
  CE: 'CE',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;
export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus];

export interface ISubmission {
  id?: string;
  problemId: string;
  userId: string;
  code: string;
  language: SupportedLanguage;
  status: SubmissionStatus;
  errorMessage?: string;
  testCasesPassed?: number;
  testCasesTotal?: number;
  timeLimit?: number;
  memoryLimit?: number;
  createdAt?: string | Date;
}

export interface SubmissionListQuery {
  userId?: string;
  problemId?: string;
  status?: SubmissionStatus;
  language?: SupportedLanguage;
  page?: number;
  limit?: number;
}

export interface SubmitCodeRequest {
  problemId: string;
  code: string;
  language: SupportedLanguage;
  matchId?: string;
}

export interface RunCodeRequest {
  problemId: string;
  code: string;
  language: SupportedLanguage;
  input?: string;
}
