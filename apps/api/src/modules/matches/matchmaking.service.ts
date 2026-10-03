import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@ocj/contracts';
import { matchRepository } from './match.repository';

export interface QueuePlayer {
  userId: string;
  socketId: string;
  username: string;
  elo: number;
}

export class MatchmakingService {
  matchmakingQueue: QueuePlayer[] = [];

  removeUserFromQueue(userId: string) {
    const index = this.matchmakingQueue.findIndex((p) => p.userId === userId);
    if (index !== -1) {
      console.log(`Removing user from queue: ${this.matchmakingQueue[index].username}`);
      this.matchmakingQueue.splice(index, 1);
    }
  }

  async joinQueue(io: Server | null, socket: Socket, userId: string) {
    try {
      const user = await matchRepository.findUserForQueue(userId);
      if (!user) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'User not found' });
        return;
      }

      const alreadyInQueue = this.matchmakingQueue.find((p) => p.userId === userId);
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

      this.matchmakingQueue.push(player);
      console.log(`Player joined queue: ${player.username} (ELO: ${player.elo})`);
      socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { status: 'QUEUED', elo: player.elo });

      await this.tryMatchmaking(io);
    } catch (err) {
      console.error('Error joining matchmaking queue:', err);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join matchmaking queue' });
    }
  }

  leaveQueue(socket: Socket, userId: string) {
    this.removeUserFromQueue(userId);
    socket.emit(SOCKET_EVENTS.QUEUE_STATUS, { status: 'IDLE' });
  }

  async tryMatchmaking(io?: Server | null) {
    if (this.matchmakingQueue.length < 2) return;

    this.matchmakingQueue.sort((a, b) => a.elo - b.elo);

    let bestDiff = Infinity;
    let matchIndex = -1;

    for (let i = 0; i < this.matchmakingQueue.length - 1; i++) {
      const diff = Math.abs(this.matchmakingQueue[i].elo - this.matchmakingQueue[i + 1].elo);
      if (diff < bestDiff) {
        bestDiff = diff;
        matchIndex = i;
      }
    }

    if (matchIndex !== -1) {
      const player1 = this.matchmakingQueue[matchIndex];
      const player2 = this.matchmakingQueue[matchIndex + 1];
      this.matchmakingQueue.splice(matchIndex, 2);
      await this.startMatch(io, player1, player2);
    }
  }

  async startMatch(io: Server | null | undefined, p1: QueuePlayer, p2: QueuePlayer) {
    try {
      const problem = await matchRepository.getRandomProblem();
      const match = await matchRepository.createMatch({
        player1Id: p1.userId,
        player2Id: p2.userId,
        problemId: problem.id,
      });

      const p1Socket = io?.sockets.sockets.get(p1.socketId);
      const p2Socket = io?.sockets.sockets.get(p2.socketId);

      const roomName = `match:${match.id}`;
      p1Socket?.join(roomName);
      p2Socket?.join(roomName);

      io?.to(roomName).emit(SOCKET_EVENTS.MATCH_FOUND, {
        matchId: match.id,
        problem: {
          id: problem.id,
          title: problem.title,
          slug: problem.slug,
          description: problem.description,
          difficulty: problem.difficulty,
          timeLimit: problem.time_limit,
          memoryLimit: problem.memory_limit,
          starterCodes: {
            cpp: problem.starter_code_cpp,
            java: problem.starter_code_java,
            python: problem.starter_code_python,
          },
        },
        player1: { userId: p1.userId, username: p1.username, elo: p1.elo },
        player2: { userId: p2.userId, username: p2.username, elo: p2.elo },
      });
    } catch (err) {
      console.error('Error starting match:', err);
      this.matchmakingQueue.push(p1, p2);
    }
  }
}

export const matchmakingService = new MatchmakingService();

// Export aliases for function-based consumers/tests
export const matchmakingQueue = matchmakingService.matchmakingQueue;
export const removeUserFromQueue = (userId: string) => matchmakingService.removeUserFromQueue(userId);
export const tryMatchmaking = (io?: Server | null) => matchmakingService.tryMatchmaking(io);
export const startMatch = (p1: QueuePlayer, p2: QueuePlayer) => matchmakingService.startMatch(null, p1, p2);
