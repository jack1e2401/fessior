import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const user = await userService.getMe(userId);
    
    res.status(200).json({
      status: 'Success',
      message: 'User profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const { full_name, bio, avatar_url } = req.body;
    const updatedUser = await userService.updateMe(userId, { full_name, bio, avatar_url });
    
    res.status(200).json({
      status: 'Success',
      message: 'User profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    
    if (!username || typeof username !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid username' });
      return;
    }
    
    const user = await userService.getUserByUsername(username);
    
    res.status(200).json({
      status: 'Success',
      message: 'User profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await userService.getUserSubmissions(userId, page, limit);
    
    res.status(200).json({
      status: 'Success',
      message: 'User submissions retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const badges = await userService.getUserBadges(userId);
    
    res.status(200).json({
      status: 'Success',
      message: 'User badges retrieved successfully',
      data: badges,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTagStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const tagStats = await userService.getUserTagStats(userId);
    
    res.status(200).json({
      status: 'Success',
      message: 'User tag statistics retrieved successfully',
      data: tagStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserEloHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await userService.getUserEloHistory(userId, page, limit);
    
    res.status(200).json({
      status: 'Success',
      message: 'User ELO history retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStreak = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'Error', message: 'Unauthorized' });
      return;
    }
    
    const streakData = await userService.getUserStreak(userId);
    
    res.status(200).json({
      status: 'Success',
      message: 'User streak and heatmap retrieved successfully',
      data: streakData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    
    const result = await userService.getAllUsers(page, limit, search);
    
    res.status(200).json({
      status: 'Success',
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByIdAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid user ID' });
      return;
    }
    
    const user = await userService.getUserByIdAdmin(id);
    
    res.status(200).json({
      status: 'Success',
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSubmissionsByUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    
    if (!username || typeof username !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid username' });
      return;
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await userService.getUserSubmissionsByUsername(username, page, limit);
    
    res.status(200).json({
      status: 'Success',
      message: 'User submissions retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTagStatsByUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    
    if (!username || typeof username !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid username' });
      return;
    }
    
    const result = await userService.getUserTagStatsByUsername(username);
    
    res.status(200).json({
      status: 'Success',
      message: 'User tag statistics retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserEloHistoryByUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    
    if (!username || typeof username !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid username' });
      return;
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await userService.getUserEloHistoryByUsername(username, page, limit);
    
    res.status(200).json({
      status: 'Success',
      message: 'User ELO history retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStreakByUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    
    if (!username || typeof username !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid username' });
      return;
    }
    
    const result = await userService.getUserStreakByUsername(username);
    
    res.status(200).json({
      status: 'Success',
      message: 'User streak retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid user ID' });
      return;
    }
    
    const updatedUser = await userService.adminUpdateUser(id, req.body);
    
    res.status(200).json({
      status: 'Success',
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid user ID' });
      return;
    }
    
    const updatedUser = await userService.updateUserRole(id, role);
    
    res.status(200).json({
      status: 'Success',
      message: 'User role updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const banUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid user ID' });
      return;
    }
    
    const bannedUser = await userService.banUser(id, reason);
    
    res.status(200).json({
      status: 'Success',
      message: 'User banned successfully',
      data: bannedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const unbanUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({ status: 'Error', message: 'Invalid user ID' });
      return;
    }
    
    const unbannedUser = await userService.unbanUser(id);
    
    res.status(200).json({
      status: 'Success',
      message: 'User unbanned successfully',
      data: unbannedUser,
    });
  } catch (error) {
    next(error);
  }
};
