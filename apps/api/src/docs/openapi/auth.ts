import { body, object, op, path, ref, type Paths } from './common';

export const authPaths: Paths = {
  '/api/v1/auth/register': {
    post: op('Auth', 'Register', 201, { security: [], requestBody: body(ref('RegisterRequest')) }),
  },
  '/api/v1/auth/login': { post: op('Auth', 'Log in', 200, { security: [], requestBody: body(ref('LoginRequest')) }) },
  '/api/v1/auth/logout': {
    post: op('Auth', 'Log out', 200, {
      requestBody: body(object({ refreshToken: { type: 'string' } }, ['refreshToken'])),
    }),
  },
  '/api/v1/auth/refresh': {
    post: op('Auth', 'Refresh access token', 200, {
      security: [],
      requestBody: body(object({ refreshToken: { type: 'string' } }, ['refreshToken'])),
    }),
  },
  '/api/v1/auth/me': { get: op('Auth', 'Get current account') },
  '/api/v1/auth/sessions': { get: op('Auth', 'List active sessions'), delete: op('Auth', 'Revoke all sessions') },
  '/api/v1/auth/sessions/{sessionId}': {
    delete: op('Auth', 'Revoke a session', 200, { parameters: [path('sessionId')] }),
  },
};
