export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type SubmissionStatus = "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "SYSTEM_ERROR" | "PENDING" | null;

export interface ProblemTag {
  id: number;
  name: string;
}

export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  acRate: number; // 0-100 percentage
  userStatus: SubmissionStatus; // null = not attempted
  hasAI: boolean; // whether Arya AI hint available
}

export interface ProblemListResponse {
  items: ProblemListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ProblemFilters {
  page: number;
  limit: number;
  difficulty?: Difficulty;
  tag?: string;
  q?: string;
}
