import { AppError } from '../../errors/AppError';
import * as authRepo from './auth.repository';
import { hashPassword, comparePassword } from './password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt';
import { z } from 'zod';
import { registerSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import { AUTH_CONSTANTS } from './auth.constants';
import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { redis } from '../../config/redis';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type ProfileInput = { username: string; full_name: string | null; bio: string | null };
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

const enforceResetLimit = async (key: string, limit: number) => {
  const redisKey = `auth:password-reset:${digest(key)}`;
  const count = await redis.incr(redisKey);
  await redis.expire(redisKey, 60 * 60);
  if (count > limit) throw new AppError('Too many password reset requests. Try again later.', 429);
};

export const register = async (data: RegisterInput) => {
  const existingEmail = await authRepo.findUserByEmail(data.email);
  if (existingEmail) {
    throw new AppError('Email already in use', 400);
  }

  const existingUsername = await authRepo.findUserByUsername(data.username);
  if (existingUsername) {
    throw new AppError('Username already taken', 400);
  }

  const passwordHash = await hashPassword(data.password);
  
  const user = await authRepo.createUser({
    username: data.username,
    email: data.email,
    password_hash: passwordHash,
  });

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async (data: LoginInput) => {
  const user = await authRepo.findUserByEmail(data.email);
  if (!user || !user.password_hash) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.is_banned) {
    throw new AppError('Your account has been banned. Please contact support.', 401);
  }

  const isPasswordValid = await comparePassword(data.password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS);

  await authRepo.saveRefreshToken(user.id, refreshToken, expiresAt);

  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const logout = async (refreshToken: string) => {
  if (!refreshToken) return;
  try {
    await authRepo.deleteRefreshToken(refreshToken);
  } catch (error) {
    // Ignore errors if token doesn't exist
  }
};

export const refresh = async (token: string) => {
  if (!token) {
    throw new AppError('Refresh token is required', 400);
  }

  const storedToken = await authRepo.findRefreshToken(token);
  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (storedToken.expires_at < new Date()) {
    await authRepo.deleteRefreshToken(token);
    throw new AppError('Refresh token expired', 401);
  }

  try {
    const decoded = verifyRefreshToken(token);
    const payload = { userId: decoded.userId, role: decoded.role };
    
    const newAccessToken = generateAccessToken(payload);
    return { accessToken: newAccessToken };
  } catch (error) {
    await authRepo.deleteRefreshToken(token);
    throw new AppError('Invalid refresh token', 401);
  }
};

export const getMe = async (userId: string) => {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateProfile = async (userId: string, data: ProfileInput) => {
  const profile = {
    username: data.username.trim(),
    full_name: data.full_name?.trim() || null,
    bio: data.bio?.trim() || null,
  };
  const existingUsername = await authRepo.findUserByUsername(profile.username);
  if (existingUsername && existingUsername.id !== userId) {
    throw new AppError('Username already taken', 409);
  }

  try {
    const user = await authRepo.updateUserProfile(userId, profile);
    const { password_hash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error: any) {
    if (error?.code === 'P2002') throw new AppError('Username already taken', 409);
    throw error;
  }
};

export const requestPasswordReset = async (data: ForgotPasswordInput, ipAddress: string) => {
  if (!env.SMTP_USER || !env.SMTP_APP_PASSWORD) {
    throw new AppError('Password reset email is not configured', 503);
  }

  const email = data.email.trim().toLowerCase();
  await enforceResetLimit(`ip:${ipAddress}`, 20);
  await enforceResetLimit(`email:${email}`, 3);

  const genericResponse = { message: 'If an account exists for that email, a reset link will be sent shortly.' };
  const user = await authRepo.findUserByEmail(email);
  if (!user || !user.password_hash || user.is_banned) return genericResponse;

  const token = randomBytes(32).toString('base64url');
  const tokenHash = digest(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await authRepo.createPasswordResetToken(user.id, tokenHash, expiresAt);

  const resetUrl = new URL('/auth/reset-password', env.APP_PUBLIC_URL);
  resetUrl.searchParams.set('token', token);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_APP_PASSWORD.replace(/\s/g, '') },
  });

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: user.email,
      subject: 'Reset your Fessior password',
      text: `Use this one-time link to reset your password. It expires in 30 minutes:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
    });
  } catch (error) {
    await authRepo.deletePasswordResetTokenByHash(tokenHash);
    console.error('Password reset email delivery failed');
  }

  return genericResponse;
};

export const resetPassword = async (data: ResetPasswordInput) => {
  const token = await authRepo.findPasswordResetToken(digest(data.token));
  if (!token || token.expires_at <= new Date() || token.is_banned) {
    if (token) await authRepo.deletePasswordResetToken(token.id);
    throw new AppError('This password reset link is invalid or expired.', 400);
  }

  const passwordHash = await hashPassword(data.password);
  const consumed = await authRepo.completePasswordReset(token.user_id, token.id, passwordHash);
  if (!consumed) throw new AppError('This password reset link is invalid or expired.', 400);
  return { message: 'Password updated. Please sign in with your new password.' };
};
