import * as userRepo from './user.repository';
import * as authRepo from '../auth/auth.repository';
import { AppError } from '../../errors/AppError';

const formatSubmission = (submission: any) => ({
  id: submission.id,
  _id: submission.id,
  userId: submission.user_id,
  problemId: submission.problem_id,
  language: submission.language,
  status: submission.status,
  executionTime: submission.execution_time,
  memoryUsed: submission.memory_used,
  errorMessage: submission.error_message,
  testCasesPassed: submission.test_cases_passed,
  testCasesTotal: submission.test_cases_total,
  createdAt: submission.created_at,
  problem: submission.problem
    ? {
        id: submission.problem.id,
        title: submission.problem.title,
        slug: submission.problem.slug,
        difficulty: submission.problem.difficulty,
      }
    : undefined,
});

export const getMe = async (userId: string) => {
  const user = await userRepo.findUserById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
};

export const updateMe = async (userId: string, data: { full_name?: string; bio?: string; avatar_url?: string | null }) => {
  const user = await userRepo.updateUserById(userId, data);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
};

export const getUserByUsername = async (username: string) => {
  const user = await userRepo.findUserByUsername(username);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
};

export const getUserSubmissions = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const [submissions, total] = await userRepo.findUserSubmissions(userId, skip, limit);
  
  return {
    submissions: submissions.map(formatSubmission),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserEloHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  return await userRepo.getUserEloHistory(userId, page, limit);
};

export const getUserStreak = async (userId: string) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364); 
  
  const activities = await userRepo.getUserActivities(userId, startDate, endDate);
  
  const heatmap: Record<string, number> = {};
  activities.forEach(activity => {
    const dateStr = activity.activity_date.toISOString().split('T')[0];
    heatmap[dateStr] = activity.problems_solved_count;
  });
  
  return {
    current_streak: user.streak_count,
    max_streak: user.max_streak,
    last_active_date: (user as any).updated_at,
    heatmap,
  };
};

export const getAllUsers = async (page: number, limit: number, search?: string) => {
  return await userRepo.getAllUsers(page, limit, search);
};

export const getUserByIdAdmin = async (userId: string) => {
  const user = await userRepo.findUserByIdAdmin(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const getUserSubmissionsByUsername = async (username: string, page: number = 1, limit: number = 10) => {
  const user = await userRepo.findUserByUsername(username);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const skip = (page - 1) * limit;
  
  const [submissions, total] = await userRepo.findUserAcceptedSubmissions(user.id, skip, limit);
  
  return {
    username: user.username,
    submissions: submissions.map(formatSubmission),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserEloHistoryByUsername = async (username: string, page: number = 1, limit: number = 10) => {
  const user = await userRepo.findUserByUsername(username);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return await userRepo.getUserEloHistory(user.id, page, limit);
};

export const getUserStreakByUsername = async (username: string) => {
  const user = await userRepo.findUserByUsername(username);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364); 
  
  const activities = await userRepo.getUserActivities(user.id, startDate, endDate);
  
  const heatmap: Record<string, number> = {};
  activities.forEach(activity => {
    const dateStr = activity.activity_date.toISOString().split('T')[0];
    heatmap[dateStr] = activity.problems_solved_count;
  });
  
  return {
    current_streak: user.streak_count,
    max_streak: user.max_streak,
    last_active_date: (user as any).updated_at,
    heatmap,
  };
};

export const adminUpdateUser = async (id: string, data: {
  username?: string;
  email?: string;
  full_name?: string;
  bio?: string;
  elo_rating?: number;
  code_coins?: number;
}) => {
  const existingUser = await userRepo.findUserByIdAdmin(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }
  
  if (data.username) {
    const userWithSameUsername = await userRepo.findUserByUsername(data.username);
    if (userWithSameUsername && userWithSameUsername.id !== id) {
      throw new AppError('Username already taken', 400);
    }
  }
  
  if (data.email) {
    const userWithSameEmail = await authRepo.findUserByEmail(data.email);
    if (userWithSameEmail && userWithSameEmail.id !== id) {
      throw new AppError('Email already in use', 400);
    }
  }
  
  return await userRepo.adminUpdateUser(id, data);
};

export const updateUserRole = async (id: string, role: 'USER' | 'ADMIN') => {
  const existingUser = await userRepo.findUserByIdAdmin(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }
  
  return await userRepo.updateUserRole(id, role);
};

export const banUser = async (id: string, reason?: string) => {
  const existingUser = await userRepo.findUserByIdAdmin(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (existingUser.is_banned) {
    throw new AppError('User is already banned', 400);
  }
  
  return await userRepo.banUser(id, reason);
};

export const unbanUser = async (id: string) => {
  const existingUser = await userRepo.findUserByIdAdmin(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }
  
  if (!existingUser.is_banned) {
    throw new AppError('User is not banned', 400);
  }
  
  return await userRepo.unbanUser(id);
};
