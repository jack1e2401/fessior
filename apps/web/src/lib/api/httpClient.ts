import type { ApiResponse, HttpMethod } from './types';
import { ApiError } from './types';

export interface HttpClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => string | null;
  private readonly onUnauthorized?: () => void;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.getAccessToken = config.getAccessToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  async request<TData>(method: HttpMethod, path: string, options?: { body?: unknown; headers?: Record<string, string> }): Promise<TData> {
    const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const accessToken = this.getAccessToken?.() ?? null;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options?.headers ?? {}),
      },
      ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });

    const payload = (await res.json().catch(() => null)) as ApiResponse<TData> | null;

    if (res.status === 401) {
      this.onUnauthorized?.();
    }

    if (!res.ok) {
      const message = payload?.message ?? 'Request failed';
      throw new ApiError(message, { statusCode: res.status, payload });
    }

    if (!payload || payload.status !== 'Success' || payload.data === undefined) {
      throw new ApiError(payload?.message ?? 'Invalid response', { statusCode: res.status, payload });
    }

    return payload.data;
  }
}

