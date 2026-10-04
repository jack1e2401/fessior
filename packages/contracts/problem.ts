export const ProblemDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type ProblemDifficulty = typeof ProblemDifficulty[keyof typeof ProblemDifficulty];

export interface IProblem {
  id?: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  timeLimit?: number;
  memoryLimit?: number;
  starterCodes?: {
    cpp?: string;
    java?: string;
    python?: string;
  };
}

export interface ProblemListQuery {
  search?: string;
  difficulty?: ProblemDifficulty;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'difficulty' | 'createdAt' | 'solvedCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProblemRequest {
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  timeLimit?: number;
  memoryLimit?: number;
  starterCodes?: IProblem['starterCodes'];
}

export type UpdateProblemRequest = Partial<CreateProblemRequest>;
