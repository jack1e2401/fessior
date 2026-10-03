import jwt from 'jsonwebtoken';

// Nên lấy từ biến môi trường
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_123';

export interface JwtPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign({ ...payload, jti: Math.random().toString(36).substring(7) }, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};
