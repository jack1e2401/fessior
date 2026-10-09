import { z } from 'zod';
import { EMAIL_REGEX, USERNAME_REGEX, checkPasswordStrength } from './auth-validation';

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

export const updateProfileSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(USERNAME_REGEX),
  full_name: z.string().trim().max(100).nullable(),
  bio: z.string().trim().max(500).nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().regex(EMAIL_REGEX),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(40).max(100),
  password: registerSchema.shape.password,
});
