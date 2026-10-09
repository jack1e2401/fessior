import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from './jwt';
import { prisma } from '../../config/prisma';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & {
        username?: string;
        email?: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { is_banned: true },
    });

    if (!user || user.is_banned) {
      res.status(401).json({ status: 'Error', message: 'Your account has been banned.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ status: 'Error', message: 'Invalid or expired token' });
    return;
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ status: 'Error', message: 'Forbidden: Admin access required' });
    return;
  }
  next();
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { is_banned: true },
      });

      if (user && !user.is_banned) {
        req.user = decoded;
      }
    }
  } catch (error) {
    // Ignore error for optional auth
  } finally {
    next();
  }
};