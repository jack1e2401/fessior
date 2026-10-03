import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/jwt';
import { redis } from '../config/redis';
import { SOCKET_EVENTS } from '@ocj/contracts';
import { registerMatchSocketHandlers } from '../modules/matches/match.socket';
import { matchmakingService } from '../modules/matches/matchmaking.service';
import { subscribeToSubmissionUpdates } from './submission-updates.subscriber';

export let io: Server | null = null;

export const initSocketServer = (socketIoServer: Server) => {
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
    const connUserId = socket.data.user?.userId;
    console.log(`Socket connected: ${socket.id} (User: ${connUserId})`);

    if (connUserId) {
      redis.sadd('online_users', connUserId).catch((err) => console.error(err));
      socket.join(`user:${connUserId}`);
    }

    // Register module-specific socket event handlers
    registerMatchSocketHandlers(io!, socket);

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (connUserId) {
        matchmakingService.removeUserFromQueue(connUserId);
        redis.srem('online_users', connUserId).catch((err) => console.error(err));
      }
    });
  });

  // Start submission updates subscriber
  subscribeToSubmissionUpdates(io);

  return io;
};
