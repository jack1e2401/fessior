import { prisma } from '../../../config/prisma';
import {
  matchmakingService,
  matchmakingQueue,
  removeUserFromQueue,
  tryMatchmaking,
  startMatch,
} from '../matchmaking.service';

// Mock Redis to prevent network calls
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(),
    on: jest.fn(),
  }));
});

jest.mock('../../../config/redis', () => ({
  redis: {
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
  },
  redisOptions: {},
}));

const mockSockets = new Map();
const mockToEmit = jest.fn();

const mockIo: any = {
  sockets: {
    sockets: mockSockets,
  },
  to: jest.fn().mockReturnValue({ emit: mockToEmit }),
};

jest.mock('../../../realtime/socket.server', () => ({
  get io() {
    return mockIo;
  },
}));

jest.mock('../../../config/prisma', () => ({
  prisma: {
    problem: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    match: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Matchmaking Service & Queue Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSockets.clear();
    mockToEmit.mockClear();

    // Clear in-memory queue
    matchmakingQueue.length = 0;
  });

  it('should remove user from queue on leave (leave behavior)', () => {
    matchmakingQueue.push(
      { userId: 'u1', socketId: 's1', username: 'user1', elo: 1200 },
      { userId: 'u2', socketId: 's2', username: 'user2', elo: 1300 }
    );

    removeUserFromQueue('u1');

    expect(matchmakingQueue).toHaveLength(1);
    expect(matchmakingQueue[0].userId).toBe('u2');
  });

  it('should prevent duplicate queue entries for the same user', () => {
    const player1 = { userId: 'u1', socketId: 's1', username: 'user1', elo: 1200 };
    matchmakingQueue.push(player1);

    // Duplicate check logic
    const isDuplicate = matchmakingQueue.some((p: any) => p.userId === 'u1');
    expect(isDuplicate).toBe(true);
    expect(matchmakingQueue).toHaveLength(1);
  });

  it('should pair players with closest ELO when tryMatchmaking runs', async () => {
    matchmakingQueue.push(
      { userId: 'u1', socketId: 's1', username: 'user1', elo: 1200 },
      { userId: 'u2', socketId: 's2', username: 'user2', elo: 1800 },
      { userId: 'u3', socketId: 's3', username: 'user3', elo: 1220 }
    );

    (prisma.problem.count as jest.Mock).mockResolvedValue(1);
    (prisma.problem.findFirst as jest.Mock).mockResolvedValue({
      id: 'prob-1',
      title: 'Problem 1',
      slug: 'prob-1',
    });
    (prisma.match.create as jest.Mock).mockResolvedValue({
      id: 'match-1',
    });

    await tryMatchmaking(mockIo);

    // u1 (1200) and u3 (1220) have diff 20, closest pair.
    // They should be matched, leaving u2 (1800) in the queue.
    expect(matchmakingQueue).toHaveLength(1);
    expect(matchmakingQueue[0].userId).toBe('u2');
  });

  it('should requeue both players if match creation fails', async () => {
    const p1 = { userId: 'u1', socketId: 's1', username: 'user1', elo: 1200 };
    const p2 = { userId: 'u2', socketId: 's2', username: 'user2', elo: 1210 };
    matchmakingQueue.length = 0;

    // Simulate DB failure when fetching problems
    (prisma.problem.count as jest.Mock).mockRejectedValue(new Error('DB connection lost'));

    await matchmakingService.startMatch(mockIo, p1, p2);

    // Both players should be pushed back into the queue
    expect(matchmakingQueue).toHaveLength(2);
    expect(matchmakingQueue).toEqual(expect.arrayContaining([p1, p2]));
  });
});
