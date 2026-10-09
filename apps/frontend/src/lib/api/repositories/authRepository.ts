import { API_ROUTES } from '@ocj/contracts';
import type { IUser, UpdateProfileRequest } from '@ocj/contracts';
import type { AuthTokens, LoginRequest, RegisterRequest } from '../types';
import { HttpClient } from '../httpClient';

export interface LoginResponseData extends AuthTokens {
  user: IUser;
}

export interface RegisterResponseData extends Partial<AuthTokens> {
  user?: IUser;
}

export class AuthRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  login(payload: LoginRequest): Promise<LoginResponseData> {
    return this.http.request('POST', `${API_ROUTES.AUTH}/login`, { body: payload });
  }

  register(payload: RegisterRequest): Promise<RegisterResponseData> {
    return this.http.request('POST', `${API_ROUTES.AUTH}/register`, { body: payload });
  }

  me(): Promise<IUser> {
    return this.http.request('GET', `${API_ROUTES.AUTH}/me`);
  }

  updateMe(payload: UpdateProfileRequest): Promise<IUser> {
    return this.http.request('PATCH', `${API_ROUTES.AUTH}/me`, { body: payload });
  }

  requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.http.request('POST', `${API_ROUTES.AUTH}/forgot-password`, { body: { email } });
  }

  resetPassword(payload: { token: string; password: string }): Promise<{ message: string }> {
    return this.http.request('POST', `${API_ROUTES.AUTH}/reset-password`, { body: payload });
  }

  logout(payload: { refreshToken: string | null }): Promise<{ ok: true }> {
    return this.http.request('POST', `${API_ROUTES.AUTH}/logout`, { body: payload });
  }
}

