import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@ocj/contracts';

let socket: Socket | null = null;

export const socketService = {
  connect: (token: string) => {
    if (socket) return socket;
    
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:6868';
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected successfully with ID:', socket?.id);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Socket disconnected');
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,

  // Matchmaking Emitters
  joinQueue: () => {
    socket?.emit(SOCKET_EVENTS.JOIN_QUEUE);
  },

  leaveQueue: () => {
    socket?.emit(SOCKET_EVENTS.LEAVE_QUEUE);
  },

  forfeitMatch: (matchId: string) => {
    socket?.emit(SOCKET_EVENTS.FORFEIT_MATCH, { matchId });
  },

  joinMatch: (matchId: string) => {
    socket?.emit('join-match', { matchId });
  },

  leaveMatch: (matchId: string) => {
    socket?.emit('leave-match', { matchId });
  },

  // Listeners
  onQueueStatus: (callback: (data: { status: 'QUEUED' | 'IDLE' | 'MATCHED'; elo?: number; message?: string }) => void) => {
    socket?.off(SOCKET_EVENTS.QUEUE_STATUS);
    socket?.on(SOCKET_EVENTS.QUEUE_STATUS, callback);
  },

  onMatchFound: (callback: (data: {
    matchId: string;
    problem: {
      id: string;
      title: string;
      slug: string;
      description: string;
      difficulty: string;
      timeLimit: number;
      memoryLimit: number;
      starterCodes?: any;
    };
    player1: { userId: string; username: string; elo: number };
    player2: { userId: string; username: string; elo: number };
  }) => void) => {
    socket?.off(SOCKET_EVENTS.MATCH_FOUND);
    socket?.on(SOCKET_EVENTS.MATCH_FOUND, callback);
  },

  onRivalSubmission: (callback: (data: {
    userId: string;
    status: string;
    testCasesPassed: number;
    testCasesTotal: number;
  }) => void) => {
    socket?.off(SOCKET_EVENTS.RIVAL_SUBMISSION);
    socket?.on(SOCKET_EVENTS.RIVAL_SUBMISSION, callback);
  },

  onMatchEnded: (callback: (data: {
    winnerId: string;
    loserId: string;
    eloUpdates: {
      [userId: string]: { elo: number; change: number; streak: number };
    };
  }) => void) => {
    socket?.off(SOCKET_EVENTS.MATCH_ENDED);
    socket?.on(SOCKET_EVENTS.MATCH_ENDED, callback);
  },

};
