import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '@ocj/contracts';
import { matchmakingService } from './matchmaking.service';
import { matchService } from './match.service';

export const registerMatchSocketHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.user?.userId;

  socket.on(SOCKET_EVENTS.JOIN_QUEUE, async () => {
    if (!userId) return;
    await matchmakingService.joinQueue(io, socket, userId);
  });

  socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
    if (!userId) return;
    matchmakingService.leaveQueue(socket, userId);
  });

  socket.on(SOCKET_EVENTS.FORFEIT_MATCH, async (data: { matchId: string }) => {
    if (!userId || !data?.matchId) return;
    try {
      await matchService.handleForfeit(io, data.matchId, userId);
    } catch (err) {
      console.error('Error forfeiting match:', err);
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_MATCH, (data: { matchId: string }) => {
    if (!data?.matchId) return;
    socket.join(SOCKET_ROOMS.match(data.matchId));
    console.log(`Socket ${socket.id} joined match: ${data.matchId}`);
  });

  socket.on(SOCKET_EVENTS.LEAVE_MATCH, (data: { matchId: string }) => {
    if (!data?.matchId) return;
    socket.leave(SOCKET_ROOMS.match(data.matchId));
    console.log(`Socket ${socket.id} left match: ${data.matchId}`);
  });
};
