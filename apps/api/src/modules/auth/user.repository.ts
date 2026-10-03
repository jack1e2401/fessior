import { prisma } from '../../config/prisma';

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      avatar_url: true,
      role: true,
      elo_rating: true,
      streak_count: true,
      max_streak: true,
      code_coins: true,
      bio: true,
      full_name: true,
      created_at: true,
      last_active_date: true,
    },
  });
};

export const updateUserById = async (id: string, data: { full_name?: string; bio?: string }) => {
  return prisma.user.update({
    where: { id },
    data: {
      full_name: data.full_name,
      bio: data.bio,
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatar_url: true,
      role: true,
      elo_rating: true,
      streak_count: true,
      max_streak: true,
      code_coins: true,
      bio: true,
      full_name: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatar_url: true,
      role: true,
      elo_rating: true,
      streak_count: true,
      max_streak: true,
      code_coins: true,
      bio: true,
      full_name: true,
      created_at: true,
    },
  });
};

export const updateUserAvatar = async (id: string, avatarUrl: string) => {
  return prisma.user.update({
    where: { id },
    data: { avatar_url: avatarUrl },
    select: { id: true, username: true, avatar_url: true },
  });
};

export const removeUserAvatar = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { avatar_url: null },
    select: {
      id: true,
      username: true,
      avatar_url: true,
    },
  });
};

export const getUserBadges = async (userId: string) => {
  return prisma.userBadge.findMany({
    where: { user_id: userId },
    include: {
      badge: true,
    },
    orderBy: { earned_at: 'desc' },
  });
};

export const getUserTagStats = async (userId: string) => {
  return prisma.userTagStat.findMany({
    where: { user_id: userId },
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      },
    },
    orderBy: {
      problems_solved: 'desc',
    },
  });
};

export const getUserEloHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const [history, total] = await Promise.all([
    prisma.eloHistory.findMany({
      where: { user_id: userId },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.eloHistory.count({
      where: { user_id: userId },
    }),
  ]);
  
  return {
    history,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserActivities = async (userId: string, startDate: Date, endDate: Date) => {
  return prisma.userActivity.findMany({
    where: {
      user_id: userId,
      activity_date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      activity_date: 'asc',
    },
  });
};

export const getAllUsers = async (page: number = 1, limit: number = 10, search?: string) => {
  const skip = (page - 1) * limit;
  
  const whereClause: any = {};
  if (search) {
    whereClause.OR = [
      { username: { contains: search } },
      { email: { contains: search } },
      { full_name: { contains: search } },
    ];
  }
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
        role: true,
        elo_rating: true,
        streak_count: true,
        max_streak: true,
        code_coins: true,
        bio: true,
        full_name: true,
        is_banned: true,
        created_at: true,
        last_active_date: true,
      },
    }),
    prisma.user.count({ where: whereClause }),
  ]);
  
  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findUserByIdAdmin = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      avatar_url: true,
      role: true,
      elo_rating: true,
      streak_count: true,
      max_streak: true,
      code_coins: true,
      bio: true,
      full_name: true,
      is_banned: true,
      banned_at: true,
      banned_reason: true,
      last_active_date: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const adminUpdateUser = async (id: string, data: {
  username?: string;
  email?: string;
  full_name?: string;
  bio?: string;
  elo_rating?: number;
  code_coins?: number;
}) => {
  return prisma.user.update({
    where: { id },
    data: {
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      bio: data.bio,
      elo_rating: data.elo_rating,
      code_coins: data.code_coins,
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatar_url: true,
      role: true,
      elo_rating: true,
      streak_count: true,
      max_streak: true,
      code_coins: true,
      bio: true,
      full_name: true,
      is_banned: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const updateUserRole = async (id: string, role: 'USER' | 'ADMIN') => {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      updated_at: true,
    },
  });
};

export const banUser = async (id: string, reason?: string) => {
  return prisma.user.update({
    where: { id },
    data: {
      is_banned: true,
      banned_at: new Date(),
      banned_reason: reason || null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      is_banned: true,
      banned_at: true,
      banned_reason: true,
    },
  });
};

export const unbanUser = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: {
      is_banned: false,
      banned_at: null,
      banned_reason: null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      is_banned: true,
      banned_at: true,
      banned_reason: true,
    },
  });
};
