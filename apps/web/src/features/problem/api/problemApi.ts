import type { ProblemFilters, ProblemListResponse } from "../types/problem.types";
import { mockProblemList, mockTags } from "../data/problemMock";

// ─── Toggle giữa mock và API thật ────────────────────────────────────────────
const USE_MOCK = true;

const API_BASE = import.meta.env.REACT_APP_API_URL ?? "http://localhost:8080/api/v1";

// ─── API thật ─────────────────────────────────────────────────────────────────
export async function fetchProblemsFromApi(filters: ProblemFilters): Promise<ProblemListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.q) params.set("q", filters.q);

  const res = await fetch(`${API_BASE}/problems?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch problems");
  const json = await res.json();
  return json.data as ProblemListResponse;
}

async function fetchTagsFromApi(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/problems/tags`);
  if (!res.ok) throw new Error("Failed to fetch tags");
  const json = await res.json();
  return json.data as string[];
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
async function fetchProblemsMock(filters: ProblemFilters): Promise<ProblemListResponse> {
  return new Promise((resolve) =>
    setTimeout(() => {
      let items = [...mockProblemList.items];

      // Filter by difficulty
      if (filters.difficulty) {
        items = items.filter((p) => p.difficulty === filters.difficulty);
      }

      // Filter by tag
      if (filters.tag) {
        items = items.filter((p) => p.tags.includes(filters.tag!));
      }

      // Search by query
      if (filters.q) {
        const q = filters.q.toLowerCase();
        items = items.filter((p) => p.title.toLowerCase().includes(q));
      }

      resolve({
        items: items.slice(0, filters.limit),
        total: mockProblemList.total,
        page: filters.page,
        limit: filters.limit,
      });
    }, 400)
  );
}

async function fetchTagsMock(): Promise<string[]> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(mockTags.map((t) => t.name)), 200)
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export async function fetchProblems(filters: ProblemFilters): Promise<ProblemListResponse> {
  return USE_MOCK ? fetchProblemsMock(filters) : fetchProblemsFromApi(filters);
}

export async function fetchTags(): Promise<string[]> {
  return USE_MOCK ? fetchTagsMock() : fetchTagsFromApi();
}
