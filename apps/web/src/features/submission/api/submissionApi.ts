import type {
  SubmissionRequest,
  SubmissionListResponse,
  SubmissionDetailsResponse,
} from "../types/submission.types";
import {
  mockSubmissionItems,
  mockSubmissionDetails,
} from "../data/submissionMock";

const USE_MOCK = true;
const API_BASE = import.meta.env.REACT_APP_API_URL ?? "http://localhost:8080/api";
const MOCK_DELAY_MS = 600;

function getAuthToken(): string | null {
  return (
    localStorage.getItem("accessToken") ??
    localStorage.getItem("token") ??
    localStorage.getItem("authToken")
  );
}

export async function getSubmissions(
  params: SubmissionRequest
): Promise<SubmissionListResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

    let filtered = [...mockSubmissionItems];

    // Filter by problem title or problemId (case insensitive search)
    if (params.problemId) {
      const query = params.problemId.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.problemId.toLowerCase().includes(query) ||
          (item.problemTitle && item.problemTitle.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    // Pagination
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      status: "Success",
      message: "Submissions fetched",
      data: {
        items,
        total: filtered.length,
        page,
        limit,
      },
    };
  }

  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.problemId) queryParams.append("problemId", params.problemId);
  if (params.status) queryParams.append("status", params.status);

  const response = await fetch(
    `${API_BASE}/submissions?${queryParams.toString()}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch submissions: ${response.statusText}`);
  }

  return response.json() as Promise<SubmissionListResponse>;
}

export async function getSubmissionDetails(
  id: string
): Promise<SubmissionDetailsResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    const details = mockSubmissionDetails[id];
    if (!details) {
      throw new Error("Submission not found");
    }
    return {
      status: "Success",
      message: "Submission fetched",
      data: details,
    };
  }

  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/submissions/${id}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch submission details: ${response.statusText}`
    );
  }

  return response.json() as Promise<SubmissionDetailsResponse>;
}
