jest.mock('../../../config/prisma', () => ({
  prisma: {
    $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    match: { count: jest.fn(), findMany: jest.fn() },
    problem: { findMany: jest.fn() },
  },
}));

import { prisma } from '../../../config/prisma';
import { MatchRepository } from '../match.repository';

describe('MatchRepository.getAllHistory', () => {
  it('paginates public match metadata and joins only public problem/user fields', async () => {
    const mocked = prisma as unknown as {
      match: { count: jest.Mock; findMany: jest.Mock };
      problem: { findMany: jest.Mock };
    };
    mocked.match.count.mockResolvedValue(41);
    mocked.match.findMany.mockResolvedValue([{
      id: 'match-1', problem_id: 'problem-1', status: 'FINISHED', winner_id: 'user-1',
      created_at: new Date(), updated_at: new Date(), participants: [],
    }]);
    mocked.problem.findMany.mockResolvedValue([{ id: 'problem-1', title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY' }]);

    const result = await new MatchRepository().getAllHistory(2, 20);
    expect(result.total).toBe(41);
    expect(result.items[0].problem).toMatchObject({ title: 'Two Sum' });
    expect(mocked.match.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {},
      skip: 20,
      take: 20,
      select: expect.objectContaining({
        participants: expect.objectContaining({
          select: expect.objectContaining({ user: { select: { id: true, username: true, elo_rating: true, avatar_url: true } } }),
        }),
      }),
    }));
  });

  it('keeps Home match history restricted to the signed-in participant', async () => {
    const mocked = prisma as unknown as { match: { count: jest.Mock; findMany: jest.Mock } };
    mocked.match.count.mockResolvedValue(1);
    mocked.match.findMany.mockResolvedValue([]);

    await new MatchRepository().getHistory('user-current', 1, 4);

    const expectedWhere = { participants: { some: { user_id: 'user-current' } } };
    expect(mocked.match.count).toHaveBeenCalledWith({ where: expectedWhere });
    expect(mocked.match.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere, skip: 0, take: 4 }));
  });
});
