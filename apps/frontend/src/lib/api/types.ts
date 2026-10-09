export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiStatus = 'Success' | 'Error';

export interface ApiResponse<TData> {
  status: ApiStatus;
  message?: string;
  data?: TData;
}

export class ApiError extends Error {
  public readonly statusCode?: number;
  public readonly payload?: unknown;

  constructor(message: string, options?: { statusCode?: number; payload?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = options?.statusCode;
    this.payload = options?.payload;
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

