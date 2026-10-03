import { prisma } from '../config/prisma';
import { MatchStatus, PlayerMatchStatus } from '@prisma/client';
import { io } from './socket';
import { SOCKET_EVENTS } from '@ocj/contracts';
import { calculateEloPvP } from '../modules/matches/elo';

export interface QueuePlayer {
  userId: string;
  socketId: string;
  username: string;
  elo: number;
}

export const matchmakingQueue: QueuePlayer[] = [];

export const removeUserFromQueue = (userId: string) => {
  const index = matchmakingQueue.findIndex((p) => p.userId === userId);
  if (index !== -1) {
    console.log(`Removing user from queue: ${matchmakingQueue[index].username}`);
    matchmakingQueue.splice(index, 1);
  }
};

export const tryMatchmaking = async () => {
  if (matchmakingQueue.length < 2) return;

  matchmakingQueue.sort((a, b) => a.elo - b.elo);

  let bestDiff = Infinity;
  let matchIndex = -1;

  for (let i = 0; i < matchmakingQueue.length - 1; i++) {
    const diff = Math.abs(matchmakingQueue[i].elo - matchmakingQueue[i + 1].elo);
    if (diff < bestDiff) {
      bestDiff = diff;
      matchIndex = i;
    }
  }

  if (matchIndex !== -1) {
    const player1 = matchmakingQueue[matchIndex];
    const player2 = matchmakingQueue[matchIndex + 1];
    matchmakingQueue.splice(matchIndex, 2);
    await startMatch(player1, player2);
  }
};

export const startMatch = async (p1: QueuePlayer, p2: QueuePlayer) => {
  try {
    const problemsCount = await prisma.problem.count();
    if (problemsCount === 0) throw new Error('No problems found in database to match');
    
    const randomIndex = Math.floor(Math.random() * problemsCount);
    const problem = await prisma.problem.findFirst({ skip: randomIndex });
    if (!problem) throw new Error('Failed to fetch matched problem');

    const match = await prisma.match.create({
      data: {
        player1_id: p1.userId,
        player2_id: p2.userId,
        problem_id: problem.id,
        status: MatchStatus.PENDING,
        participants: {
          create: [
            { user_id: p1.userId, status: PlayerMatchStatus.CODING, score_change: 0, is_winner: false },
            { user_id: p2.userId, status: PlayerMatchStatus.CODING, score_change: 0, is_winner: false }
          ]
        }
      },
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
    matchmakingQueue.push(p1, p2);
  }
};

export const handleSubmissionUpdate = async (data: {
  submissionId: string;
  userId: string;
  problemId: string;
  status: string;
  testCasesPassed: number;
  testCasesTotal: number;
  matchId?: string;
}) => {
  let activeMatch;
  if (data.matchId) {
    activeMatch = await prisma.match.findUnique({
      where: { id: data.matchId, status: MatchStatus.PENDING },
      include: { participants: true }
    });
  }

  if (!activeMatch) {
    activeMatch = await prisma.match.findFirst({
      where: {
        problem_id: data.problemId,
        status: MatchStatus.PENDING,
        OR: [
          { player1_id: data.userId },
          { player2_id: data.userId },
          { participants: { some: { user_id: data.userId } } }
        ],
      },
      include: { participants: true }
    });
  }

  if (!activeMatch) return;

  const roomName = `match:${activeMatch.id}`;

  io?.to(roomName).emit(SOCKET_EVENTS.RIVAL_SUBMISSION, {
    userId: data.userId,
    status: data.status,
    testCasesPassed: data.testCasesPassed,
    testCasesTotal: data.testCasesTotal,
  });

  // Update the 1v1 participant status.
  if (activeMatch.participants && activeMatch.participants.length > 0) {
    const isAC = data.status === 'ACCEPTED';
    const newStatus = isAC ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA;
    await prisma.matchParticipant.update({
      where: { match_id_user_id: { match_id: activeMatch.id, user_id: data.userId } },
      data: { status: newStatus }
    });
  }

  if (data.status === 'ACCEPTED') {
    await endMatch(activeMatch.id, data.userId);
  }
};

export const endMatch = async (matchId: string, winnerId: string) => {
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ 
      where: { id: matchId },
      include: { participants: true }
    });
    
    if (!match || match.status === MatchStatus.FINISHED) return;

    if (!match.player1_id || !match.player2_id) return;
    if (winnerId !== match.player1_id && winnerId !== match.player2_id) return;
    let eloUpdates: Record<string, any> = {};
    {
      const player1Id = match.player1_id;
      const player2Id = match.player2_id;
      const loserId = winnerId === player1Id ? player2Id : player1Id;

      const winner = await tx.user.findUnique({ where: { id: winnerId } });
      const loser = await tx.user.findUnique({ where: { id: loserId } });

      if (!winner || !loser) return;

      const { newWinnerElo, newLoserElo, winnerChange, loserChange } = calculateEloPvP(winner.elo_rating, loser.elo_rating);
      
      const newWinnerStreak = winner.streak_count + 1;
      const newWinnerMaxStreak = Math.max(winner.max_streak, newWinnerStreak);

      await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.FINISHED,
          winner_id: winnerId,
          player1_status: winnerId === player1Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
          player2_status: winnerId === player2Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
        },
      });
      
      // Update participants for 1v1
      await tx.matchParticipant.update({
        where: { match_id_user_id: { match_id: matchId, user_id: player1Id } },
        data: {
           status: winnerId === player1Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
           score_change: winnerId === player1Id ? winnerChange : loserChange,
           is_winner: winnerId === player1Id,
        }
      });
      await tx.matchParticipant.update({
        where: { match_id_user_id: { match_id: matchId, user_id: player2Id } },
        data: {
           status: winnerId === player2Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
           score_change: winnerId === player2Id ? winnerChange : loserChange,
           is_winner: winnerId === player2Id,
        }
      });

      await tx.user.update({
        where: { id: winnerId },
        data: { elo_rating: newWinnerElo, streak_count: newWinnerStreak, max_streak: newWinnerMaxStreak },
      });

      await tx.user.update({
        where: { id: loserId },
        data: { elo_rating: newLoserElo, streak_count: 0 },
      });

      eloUpdates[winnerId] = { elo: newWinnerElo, change: winnerChange, streak: newWinnerStreak };
      eloUpdates[loserId] = { elo: newLoserElo, change: loserChange, streak: 0 };
    }

    io?.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_ENDED, {
      matchId,
      winnerId,
      eloUpdates
    });
  });
};

export const handleForfeit = async (matchId: string, forfeitingUserId: string) => {
  const match = await prisma.match.findUnique({ 
    where: { id: matchId },
    include: { participants: true }
  });
  if (!match || match.status === MatchStatus.FINISHED) return;

  if (!match.player1_id || !match.player2_id) return;
  if (forfeitingUserId !== match.player1_id && forfeitingUserId !== match.player2_id) return;
  const winnerId = forfeitingUserId === match.player1_id ? match.player2_id : match.player1_id;
  await endMatch(matchId, winnerId);
};
