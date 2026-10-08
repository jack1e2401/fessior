export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  problems: {
    all: ['problems'] as const,
    list: (filters?: Record<string, unknown>) => ['problems', 'list', filters ?? {}] as const,
    detail: (slug: string) => ['problems', 'detail', slug] as const,
    detailById: (id: string) => ['problems', 'detailById', id] as const,
    testcases: (problemId: string) => ['problems', 'testcases', problemId] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    list: (filters?: Record<string, unknown>) => ['submissions', 'list', filters ?? {}] as const,
    detail: (id: string) => ['submissions', 'detail', id] as const,
    history: (userId: string) => ['submissions', 'history', userId] as const,
  },
  matches: {
    all: ['matches'] as const,
    list: (filters?: Record<string, unknown>) => ['matches', 'list', filters ?? {}] as const,
    detail: (id: string) => ['matches', 'detail', id] as const,
  },
} as const;
