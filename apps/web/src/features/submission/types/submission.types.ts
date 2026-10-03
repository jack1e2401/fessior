export type SubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "compile_error"
  | "runtime_error"
  | "memory_limit_exceeded"
  | "system_error";

export interface SubmissionRequest {
  page?: number;
  limit?: number;
  problemId?: string;
  status?: string;
}

export interface SubmissionItem {
  submissionId: string;
  problemId: string;
  problemTitle?: string;
  status: SubmissionStatus;
  language: string;
  time: number; // in seconds
  memory: number; // in KB
  createdAt?: number; // timestamp
  username?: string;
}

export interface SubmissionListResponse {
  status: string;
  message: string;
  data: {
    items: SubmissionItem[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface TestCaseResult {
  caseId: number;
  verdict: SubmissionStatus;
  time: number; // in seconds
  memory: number; // in KB;
}

export interface SubmissionDetails {
  submissionId: string;
  problemId: string;
  problemTitle?: string;
  status: SubmissionStatus;
  language: string;
  time: number; // in seconds
  memory: number; // in KB
  createdAt?: number; // timestamp
  username?: string;
  tests: TestCaseResult[];
  codeSnippet?: string;
}

export interface SubmissionDetailsResponse {
  status: string;
  message: string;
  data: SubmissionDetails;
}
