import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/api/index';
import { problemRepository } from '../../../app/api/client';
import type { IProblem } from '@ocj/contracts';

/**
 * Backend API may return data in multiple shapes:
 *   IProblem[]                    — plain array
 *   { items: IProblem[], ... }    — paginated wrapper
 *   { status, data: [...] }       — ApiResponse (if not unwrapped by HttpClient)
 *
 * This helper normalizes all shapes to IProblem[].
 */
function ensureArray<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    // Paginated response: { items: [...] }
    if (Array.isArray(obj.items)) return obj.items as T[];
    // Nested ApiResponse: { data: [...] }
    if (Array.isArray(obj.data)) return obj.data as T[];
    // Nested data.items
    if (obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.items)) return inner.items as T[];
    }
  }
  return [];
}

export function useProblems() {
  const problemsQuery = useQuery({
    queryKey: queryKeys.problems.all,
    queryFn: () => problemRepository.getProblems(),
    staleTime: 30_000,
  });

  return {
    problems: ensureArray<IProblem>(problemsQuery.data),
    isLoading: problemsQuery.isLoading,
    isError: problemsQuery.isError,
    error: problemsQuery.error,
    refetch: () => {
      problemsQuery.refetch();
    },
  };
}
