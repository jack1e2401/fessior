import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AUTH_CONSTANTS } from './auth.constants';

export interface JwtPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { ...payload, jti: Math.random().toString(36).substring(7) },
    env.JWT_REFRESH_SECRET,
    { expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS }
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
