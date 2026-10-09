import { prisma } from '../../config/prisma';

export class LeaderboardRepository {
  async list(page: number, limit: number) {
    const where = { is_banned: false };
    const skip = (page - 1) * limit;
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ elo_rating: 'desc' }, { id: 'asc' }],
        select: { id: true, username: true, avatar_url: true, elo_rating: true },
      }),
    ]);
    return { total, page, limit, items: users.map((user, index) => ({
      rank: skip + index + 1,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      eloRating: user.elo_rating,
    })) };
  }
}

export const leaderboardRepository = new LeaderboardRepository();
