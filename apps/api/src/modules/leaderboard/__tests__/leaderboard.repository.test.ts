jest.mock('../../../config/prisma', () => ({
  prisma: {
    $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    user: { count: jest.fn(), findMany: jest.fn() },
  },
}));

import { prisma } from '../../../config/prisma';
import { LeaderboardRepository } from '../leaderboard.repository';

describe('LeaderboardRepository', () => {
  it('returns stable rank and never selects private account fields', async () => {
    const mocked = prisma as unknown as { user: { count: jest.Mock; findMany: jest.Mock } };
    mocked.user.count.mockResolvedValue(21);
    mocked.user.findMany.mockResolvedValue([
      { id: 'u-21', username: 'top', avatar_url: null, elo_rating: 1800 },
    ]);

    const result = await new LeaderboardRepository().list(2, 20);
    expect(result.items[0]).toEqual({ rank: 21, userId: 'u-21', username: 'top', avatarUrl: null, eloRating: 1800 });
    expect(mocked.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ elo_rating: 'desc' }, { id: 'asc' }],
      select: { id: true, username: true, avatar_url: true, elo_rating: true },
    }));
  });
});
