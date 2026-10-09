import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { MatchmakingService } from '../modules/matches/matchmaking.service';
import { matchRepository } from '../modules/matches/match.repository';

describe('Redis-backed 1v1 matchmaking', () => {
  const suffix = Date.now().toString(36);
  const prefix = `test:matchmaking:${suffix}`;
  const services = [new MatchmakingService(redis, matchRepository, prefix), new MatchmakingService(redis, matchRepository, prefix)];
  const userIds: string[] = [];
  let problemId: string;
  const makeSocket = () => ({ emit: jest.fn() } as any);
  const io = { in: jest.fn().mockReturnValue({ socketsJoin: jest.fn() }), to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any;

  beforeAll(async () => {
    for (let i = 0; i < 7; i++) {
      const user = await prisma.user.create({ data: { username: `queue_${suffix}_${i}`, email: `queue_${suffix}_${i}@example.com`, elo_rating: 1000 + i * 20 } });
      userIds.push(user.id);
    }
    const problem = await prisma.problem.create({
      data: {
        title: 'Queue ready problem', slug: `queue-ready-${suffix}`, description: 'test', difficulty: 'EASY',
        starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
        testcase_sets: { create: { version: 1, testcases: { create: [{ position: 0, input: '1', output: '1' }] } } },
      }, include: { testcase_sets: true },
    });
    problemId = problem.id;
    await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: problem.testcase_sets[0].id } });
  });

  afterAll(async () => {
    await redis.del(`${prefix}:elo`, `${prefix}:players`, `${prefix}:lock`);
    await prisma.match.deleteMany({ where: { participants: { some: { user_id: { in: userIds } } } } });
    if (problemId) {
      await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: null } });
      await prisma.problem.delete({ where: { id: problemId } });
    }
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it('deduplicates queue joins and makes leaving idempotent', async () => {
    const socket = makeSocket();
    await services[0].joinQueue(io, socket, userIds[0]);
    await services[1].joinQueue(io, socket, userIds[0]);
    expect(await redis.zcard(`${prefix}:elo`)).toBe(1);
    await services[0].leaveQueue(socket, userIds[0]);
    await services[1].leaveQueue(socket, userIds[0]);
    expect(await redis.zcard(`${prefix}:elo`)).toBe(0);
  });

  it('concurrent coordinators pair two users once and clear Redis queue', async () => {
    await Promise.all([
      services[0].joinQueue(io, makeSocket(), userIds[1]),
      services[1].joinQueue(io, makeSocket(), userIds[2]),
    ]);
    const matches = await prisma.match.findMany({ where: { participants: { some: { user_id: userIds[1] } } }, include: { participants: true } });
    expect(matches).toHaveLength(1);
    expect(matches[0].status).toBe('RUNNING');
    expect(matches[0].participants.map((p) => p.user_id).sort()).toEqual([userIds[1], userIds[2]].sort());
    expect(await redis.zcard(`${prefix}:elo`)).toBe(0);
    const socket = makeSocket();
    await services[0].joinQueue(io, socket, userIds[1]);
    expect(socket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: 'Already in an active match' }));
    expect(await redis.zcard(`${prefix}:elo`)).toBe(0);
  });

  it('leaves the pair queued when database creation fails', async () => {
    const create = jest.spyOn(matchRepository, 'createMatch').mockRejectedValueOnce(new Error('database unavailable'));
    try {
      await services[0].joinQueue(io, makeSocket(), userIds[3]);
      await services[1].joinQueue(io, makeSocket(), userIds[4]);
      expect(await redis.zcard(`${prefix}:elo`)).toBe(2);
    } finally { create.mockRestore(); }
    await services[0].tryMatchmaking(io);
    expect(await redis.zcard(`${prefix}:elo`)).toBe(0);
  });

  it('never assigns one user to two matches during concurrent joins', async () => {
    await Promise.all([5, 6].map((index, n) => services[n].joinQueue(io, makeSocket(), userIds[index])));
    const matches = await prisma.match.findMany({ where: { participants: { some: { user_id: { in: userIds.slice(5) } } } }, include: { participants: true } });
    expect(matches).toHaveLength(1);
    for (const userId of userIds.slice(5)) {
      expect(matches[0].participants.filter((p) => p.user_id === userId)).toHaveLength(1);
    }
  });
});
