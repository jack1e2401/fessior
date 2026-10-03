import { useState, useEffect, useCallback } from "react";
import { Difficulty, ProblemFilters, ProblemListResponse } from "../types/problem.types";
import { fetchProblems, fetchTags } from "../api/problemApi";

interface UseProblemsResult {
  data: ProblemListResponse | null;
  tags: string[];
  loading: boolean;
  error: string | null;
  filters: ProblemFilters;
  setSearch: (q: string) => void;
  setDifficulty: (d: Difficulty | undefined) => void;
  setTag: (tag: string | undefined) => void;
  setPage: (page: number) => void;
}

const DEFAULT_FILTERS: ProblemFilters = {
  page: 1,
  limit: 10,
};

export function useProblems(): UseProblemsResult {
  const [data, setData] = useState<ProblemListResponse | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProblemFilters>(DEFAULT_FILTERS);

  // Load tags once
  useEffect(() => {
    fetchTags().then(setTags).catch(() => setTags([]));
  }, []);

  // Load problems whenever filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchProblems(filters)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const setSearch = useCallback((q: string) => {
    setFilters((f) => ({ ...f, q: q || undefined, page: 1 }));
  }, []);

  const setDifficulty = useCallback((d: Difficulty | undefined) => {
    setFilters((f) => ({ ...f, difficulty: d, page: 1 }));
  }, []);

  const setTag = useCallback((tag: string | undefined) => {
    setFilters((f) => ({ ...f, tag, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((f) => ({ ...f, page }));
  }, []);

  return { data, tags, loading, error, filters, setSearch, setDifficulty, setTag, setPage };
}
