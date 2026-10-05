import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '@ocj/contracts';
import { redis } from '../../config/redis';
import { MatchRepository, matchRepository } from './match.repository';

interface QueuePlayer { userId: string; username: string; elo: number }
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MatchmakingService {
  private readonly queueKey: string;
  private readonly metadataKey: string;
  private readonly lockKey: string;

  constructor(
    private readonly store: Redis = redis,
    private readonly repository: MatchRepository = matchRepository,
    prefix = 'matchmaking:v1',
  ) {
    this.queueKey = `${prefix}:elo`;
    this.metadataKey = `${prefix}:players`;
    this.lockKey = `${prefix}:lock`;
  }

  private async withLock<T>(work: () => Promise<T>): Promise<T> {
    const token = randomUUID();
    let acquired = false;
    for (let i = 0; i < 100; i++) {
      acquired = (await this.store.set(this.lockKey, token, 'PX', 30000, 'NX')) === 'OK';
      if (acquired) break;
      await sleep(50);
    }
    if (!acquired) throw new Error('Matchmaking coordinator is busy');
    try { return await work(); }
    finally {
      await this.store.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
        1, this.lockKey, token,
      );
    }
  }

  async removeUserFromQueue(userId: string) {
    await this.withLock(async () => {
      await this.store.multi().zrem(this.queueKey, userId).hdel(this.metadataKey, userId).exec();
    });
  }

  async leaveQueue(socket: Socket, userId: string) {
    try {
      await this.removeUserFromQueue(userId);
      socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { status: 'IDLE' });
    } catch (error) {
      console.error('Failed to leave matchmaking queue', error);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to leave matchmaking queue' });
    }
  }

  async joinQueue(io: Server | null, socket: Socket, userId: string) {
    try {
      const user = await this.repository.findUserForQueue(userId);
      if (!user) { socket.emit(SOCKET_EVENTS.ERROR, { message: 'User not found' }); return; }
      await this.withLock(async () => {
        if (await this.repository.findActiveMatchByUserId(userId)) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Already in an active match' });
          return;
        }
        if (await this.store.zscore(this.queueKey, userId) !== null) {
          socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { status: 'QUEUED', message: 'Already in queue' });
          return;
        }
        const player: QueuePlayer = { userId, username: user.username, elo: user.elo_rating };
        await this.store.multi()
          .zadd(this.queueKey, player.elo, player.userId)
          .hset(this.metadataKey, player.userId, JSON.stringify(player))
          .exec();
        await this.pairClosest(io);
        if (await this.store.zscore(this.queueKey, userId) !== null) {
          socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { status: 'QUEUED', elo: player.elo });
        }
      });
    } catch (error) {
      console.error('Matchmaking join failed', error);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join matchmaking queue' });
    }
  }

  async tryMatchmaking(io: Server | null) {
    await this.withLock(() => this.pairClosest(io));
  }

  private async pairClosest(io: Server | null) {
    const entries = await this.store.zrange(this.queueKey, 0, 199, 'WITHSCORES');
    if (entries.length < 4) return;
    let best = 0;
    let difference = Infinity;
    for (let i = 0; i < entries.length - 2; i += 2) {
      const gap = Math.abs(Number(entries[i + 1]) - Number(entries[i + 3]));
      if (gap < difference) { difference = gap; best = i; }
    }
    const ids = [entries[best], entries[best + 2]];
    const values = await this.store.hmget(this.metadataKey, ...ids);
    if (!values[0] || !values[1]) {
      const missing = ids.filter((_, index) => !values[index]);
      await this.store.zrem(this.queueKey, ...missing);
      return;
    }
    const [p1, p2] = values.map((value) => JSON.parse(value!) as QueuePlayer);
    for (const player of [p1, p2]) {
      if (await this.repository.findActiveMatchByUserId(player.userId)) {
        await this.store.multi().zrem(this.queueKey, player.userId).hdel(this.metadataKey, player.userId).exec();
        return;
      }
    }
    try {
      const problem = await this.repository.getRandomProblem();
      const match = await this.repository.createMatch({ player1Id: p1.userId, player2Id: p2.userId, problemId: problem.id });
      await this.store.multi().zrem(this.queueKey, p1.userId, p2.userId).hdel(this.metadataKey, p1.userId, p2.userId).exec();
      const room = SOCKET_ROOMS.match(match.id);
      io?.in(SOCKET_ROOMS.user(p1.userId)).socketsJoin(room);
      io?.in(SOCKET_ROOMS.user(p2.userId)).socketsJoin(room);
      const event = {
        matchId: match.id,
        problem: {
          id: problem.id, title: problem.title, slug: problem.slug, description: problem.description,
          difficulty: problem.difficulty, timeLimit: problem.time_limit, memoryLimit: problem.memory_limit,
          starterCodes: { cpp: problem.starter_code_cpp, java: problem.starter_code_java, python: problem.starter_code_python },
        },
        player1: p1, player2: p2,
      };
      io?.to(SOCKET_ROOMS.user(p1.userId)).emit(SOCKET_EVENTS.MATCH_FOUND, event);
      io?.to(SOCKET_ROOMS.user(p2.userId)).emit(SOCKET_EVENTS.MATCH_FOUND, event);
    } catch (error) {
      // The pair remains in Redis. The next queue join or retry can attempt it again.
      console.error('Failed to create match; players remain queued', error);
    }
  }
}

export const matchmakingService = new MatchmakingService();
