import { z } from 'zod';
import { EMAIL_REGEX, USERNAME_REGEX, checkPasswordStrength } from './shared-validators';

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(USERNAME_REGEX, 'Username must only contain alphanumeric characters or underscores'),
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100).refine((val) => {
    return checkPasswordStrength(val).isStrong;
  }, {
    message: 'Password is too weak. It must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.'
  }),
});

export const loginSchema = z.object({
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100).refine((val) => {
    return checkPasswordStrength(val).isStrong;
  }, {
    message: 'New password is too weak. It must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.'
  }),
});

export const revokeSessionParamsSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100).refine((val) => {
    return checkPasswordStrength(val).isStrong;
  }, {
    message: 'New password is too weak. It must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.'
  }),
});