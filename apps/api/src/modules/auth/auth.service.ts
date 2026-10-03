import { AppError } from '../../errors/AppError';
import * as authRepo from './auth.repository';
import { hashPassword, comparePassword } from './password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt';
import { z } from 'zod';
import { registerSchema, loginSchema } from './auth.schema';
import { AUTH_CONSTANTS } from './auth.constants';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

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

export const revokeSession = async (userId: string, sessionId: string) => {
  const token = await authRepo.findRefreshTokenById(sessionId);
  
  if (!token) {
    throw new AppError('Session not found', 404);
  }
  
  if (token.user_id !== userId) {
    throw new AppError('You are not authorized to revoke this session', 403);
  }
  
  await authRepo.revokeRefreshTokenById(sessionId);
  
  return { message: 'Session revoked successfully' };
};

export const revokeAllSessions = async (userId: string) => {
  await authRepo.revokeAllUserSessions(userId);
  return { message: 'All sessions revoked successfully' };
};

export const getUserSessions = async (userId: string) => {
  const sessions = await authRepo.getUserSessions(userId);
  return { sessions };
};
