import type { ApiResponse, HttpMethod } from './types';
import { ApiError, ApiNetworkError } from './types';

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
    const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers ?? {}),
    };

    const res = await fetch(url, {
      method,
      headers,
      ...(options?.body !== undefined
        ? { body: isFormData ? options.body as FormData : JSON.stringify(options.body) }
        : {}),
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

  requestWithUploadProgress<TData>(
    method: HttpMethod,
    path: string,
    options: { body: FormData; headers?: Record<string, string>; onProgress: (percent: number) => void; onUploadComplete?: () => void },
  ): Promise<TData> {
    const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const accessToken = this.getAccessToken?.() ?? null;

    return new Promise<TData>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let uploadCompleted = false;
      xhr.open(method, url);
      if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      for (const [name, value] of Object.entries(options.headers ?? {})) xhr.setRequestHeader(name, value);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          options.onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      };
      xhr.upload.onload = () => {
        uploadCompleted = true;
        options.onUploadComplete?.();
      };
      xhr.onerror = () => reject(new ApiNetworkError('The server response could not be confirmed', uploadCompleted));
      xhr.onabort = () => reject(new ApiNetworkError('The server response could not be confirmed', uploadCompleted));
      xhr.onload = () => {
        if (xhr.status === 0) {
          reject(new ApiNetworkError('The server response could not be confirmed', uploadCompleted));
          return;
        }
        let payload: ApiResponse<TData> | null = null;
        try { payload = JSON.parse(xhr.responseText) as ApiResponse<TData>; } catch { /* response may be empty */ }
        if (xhr.status === 401) this.onUnauthorized?.();
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new ApiError(payload?.message ?? 'Request failed', { statusCode: xhr.status, payload }));
          return;
        }
        if (!payload || payload.status !== 'Success' || payload.data === undefined) {
          reject(new ApiError(payload?.message ?? 'Invalid response', { statusCode: xhr.status, payload }));
          return;
        }
        resolve(payload.data);
      };
      try { xhr.send(options.body); }
      catch { reject(new ApiNetworkError('The server response could not be confirmed', uploadCompleted)); }
    });
  }
}

