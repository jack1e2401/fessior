import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/jwt.util';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import Redis from 'ioredis';
import {
  matchmakingQueue,
  tryMatchmaking,
  removeUserFromQueue,
  handleForfeit,
  handleSubmissionUpdate,
  QueuePlayer
} from './matchmaking';
import { SOCKET_EVENTS, REDIS_CHANNELS } from '@ocj/contracts';

export let io: Server | null = null;

// Initialize a separate Redis client for Pub/Sub subscription
const pubSubClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

export const initSocket = (socketIoServer: Server) => {
  io = socketIoServer;

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token is required'));
      }
      const decoded = verifyAccessToken(token as string);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    const connUserId = socket.data.user.userId;
    console.log(`Socket connected: ${socket.id} (User: ${connUserId})`);
    redis.sadd('online_users', connUserId).catch(err => console.error(err));
    socket.join(`user:${connUserId}`);

    // Matchmaking Join Queue
    socket.on(SOCKET_EVENTS.JOIN_QUEUE, async () => {
      try {
        const userId = socket.data.user.userId;
        
        // Fetch user ELO from MySQL
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'User not found' });
          return;
        }

        // Check if already in queue
        const alreadyInQueue = matchmakingQueue.find((p) => p.userId === userId);
        if (alreadyInQueue) {
          socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { message: 'Already in queue' });
          return;
        }

        const player: QueuePlayer = {
          userId,
          socketId: socket.id,
          username: user.username,
          elo: user.elo_rating,
        };

        matchmakingQueue.push(player);
        console.log(`Player joined queue: ${player.username} (ELO: ${player.elo})`);
        socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { status: 'QUEUED', elo: player.elo });

        // Try matchmaking
        await tryMatchmaking();
      } catch (err) {
        console.error('Error joining matchmaking queue:', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join matchmaking queue' });
      }
    });

    // Leave Queue
    socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
      removeUserFromQueue(socket.data.user.userId);
      socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { status: 'IDLE' });
    });

    // Handle Forfeit/Leave Match
    socket.on(SOCKET_EVENTS.FORFEIT_MATCH, async (data: { matchId: string }) => {
      try {
        const userId = socket.data.user.userId;
        await handleForfeit(data.matchId, userId);
      } catch (err) {
        console.error('Error forfeiting match:', err);
      }
    });

    socket.on('join-match', (data: { matchId: string }) => {
      socket.join(`match:${data.matchId}`);
      console.log(`Socket ${socket.id} joined match: ${data.matchId}`);
    });

    socket.on('leave-match', (data: { matchId: string }) => {
      socket.leave(`match:${data.matchId}`);
      console.log(`Socket ${socket.id} left match: ${data.matchId}`);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Socket disconnected: ${socket.id}`);
      removeUserFromQueue(socket.data.user.userId);
      redis.srem('online_users', socket.data.user.userId).catch(err => console.error(err));
    });
  });

  // Subscribe to Redis Pub/Sub submission updates
  pubSubClient.subscribe(REDIS_CHANNELS.SUBMISSION_UPDATES, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${REDIS_CHANNELS.SUBMISSION_UPDATES} channel:`, err);
    } else {
      console.log(`Subscribed to ${REDIS_CHANNELS.SUBMISSION_UPDATES} channel successfully`);
    }
  });

  pubSubClient.on('message', async (channel, message) => {
    if (channel === REDIS_CHANNELS.SUBMISSION_UPDATES) {
      try {
        const data = JSON.parse(message);
        await handleSubmissionUpdate(data);
      } catch (err) {
        console.error('Error parsing submission update message:', err);
      }
    }
  });
};
