import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      status: 'Success',
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json({
      status: 'Success',
      message: 'Login successful',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(200).json({
      status: 'Success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const data = await authService.refresh(refreshToken);
    res.status(200).json({
      status: 'Success',
      message: 'Token refreshed successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    const user = await authService.getMe(userId);
    res.status(200).json({
      status: 'Success',
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }

    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({
      status: 'Success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid session ID' });
      return;
    }

    await authService.revokeSession(userId, sessionId);
    
    res.status(200).json({
      status: 'Success',
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const revokeAllSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    await authService.revokeAllSessions(userId);
    
    res.status(200).json({
      status: 'Success',
      message: 'All sessions revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const data = await authService.getUserSessions(userId);
    
    res.status(200).json({
      status: 'Success',
      message: 'Sessions retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    
    res.status(200).json({
      status: 'Success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    
    res.status(200).json({
      status: 'Success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};