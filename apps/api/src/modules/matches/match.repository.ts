import { prisma } from '../../config/prisma';
import { MatchStatus, PlayerMatchStatus, Prisma } from '@prisma/client';
import { calculateEloPvP } from './elo';

export class MatchRepository {
  async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [total, items] = await prisma.$transaction([
      prisma.match.count({
        where: {
          participants: { some: { user_id: userId } },
        },
      }),
      prisma.match.findMany({
        where: {
          participants: { some: { user_id: userId } },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          participants: {
            orderBy: [{ joined_at: 'asc' }, { id: 'asc' }],
            include: {
              user: { select: { id: true, username: true, elo_rating: true, avatar_url: true } }
            }
          }
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      items,
    };
  }

  async findById(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          orderBy: [{ joined_at: 'asc' }, { id: 'asc' }],
          include: {
            user: { select: { id: true, username: true, elo_rating: true, avatar_url: true } }
          }
        }
      },
    });
  }

  async findActiveMatchByUserId(userId: string) {
    return prisma.match.findFirst({
      where: {
        status: MatchStatus.PENDING,
        participants: { some: { user_id: userId } },
      },
      include: {
        participants: {
          orderBy: [{ joined_at: 'asc' }, { id: 'asc' }],
          include: {
            user: { select: { id: true, username: true, elo_rating: true, avatar_url: true } }
          }
        }
      },
    });
  }

  async delete(matchId: string) {
    return prisma.match.delete({
      where: { id: matchId },
    });
  }

  async findUserForQueue(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        elo_rating: true,
      },
    });
  }

  async getRandomProblem() {
    const problemsCount = await prisma.problem.count();
    if (problemsCount === 0) throw new Error('No problems found in database to match');

    const randomIndex = Math.floor(Math.random() * problemsCount);
    const problem = await prisma.problem.findFirst({ skip: randomIndex });
    if (!problem) throw new Error('Failed to fetch matched problem');

    return problem;
  }

  async createMatch(data: { player1Id: string; player2Id: string; problemId: string }) {
    if (data.player1Id === data.player2Id) throw new Error('A 1v1 match requires two distinct users');
    return prisma.match.create({
      data: {
        problem_id: data.problemId,
        status: MatchStatus.PENDING,
        participants: {
          create: [
            { user_id: data.player1Id, status: PlayerMatchStatus.CODING, score_change: 0, is_winner: false },
            { user_id: data.player2Id, status: PlayerMatchStatus.CODING, score_change: 0, is_winner: false },
          ],
        },
      },
    });
  }

  async findActiveMatchForSubmission(matchId?: string, problemId?: string, userId?: string) {
    if (matchId) {
      return prisma.match.findFirst({
        where: {
          id: matchId,
          status: MatchStatus.PENDING,
          ...(problemId ? { problem_id: problemId } : {}),
          ...(userId ? { participants: { some: { user_id: userId } } } : {}),
        },
        include: { participants: true },
      });
    }

    if (problemId && userId) {
      return prisma.match.findFirst({
        where: {
          problem_id: problemId,
          status: MatchStatus.PENDING,
          participants: { some: { user_id: userId } },
        },
        include: { participants: true },
      });
    }

    return null;
  }

  async updateParticipantStatus(matchId: string, userId: string, status: PlayerMatchStatus) {
    return prisma.matchParticipant.update({
      where: { match_id_user_id: { match_id: matchId, user_id: userId } },
      data: { status },
    });
  }

  async findParticipant(matchId: string, userId: string) {
    return prisma.matchParticipant.findUnique({
      where: { match_id_user_id: { match_id: matchId, user_id: userId } },
    });
  }

  async addParticipant(matchId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { participants: true },
      });
      if (!match) throw new Error('Match not found');
      if (match.participants.length >= 2) throw new Error('1v1 match is full');
      return tx.matchParticipant.create({ data: { match_id: matchId, user_id: userId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async endMatchWithEloTransaction(matchId: string, winnerId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { participants: true },
      });

      if (!match || match.status === MatchStatus.FINISHED) return null;
      if (match.participants.length !== 2) return null;
      if (!match.participants.some((participant) => participant.user_id === winnerId)) return null;
      const loserId = match.participants.find((participant) => participant.user_id !== winnerId)?.user_id;
      if (!loserId) return null;

      const winner = await tx.user.findUnique({ where: { id: winnerId } });
      const loser = await tx.user.findUnique({ where: { id: loserId } });

      if (!winner || !loser) return null;

      const { newWinnerElo, newLoserElo, winnerChange, loserChange } = calculateEloPvP(
        winner.elo_rating,
        loser.elo_rating
      );

      const newWinnerStreak = winner.streak_count + 1;
      const newWinnerMaxStreak = Math.max(winner.max_streak, newWinnerStreak);

      await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.FINISHED,
          winner_id: winnerId,
        },
      });

      await tx.matchParticipant.update({
        where: { match_id_user_id: { match_id: matchId, user_id: winnerId } },
        data: {
          status: PlayerMatchStatus.ACCEPTED,
          score_change: winnerChange,
          is_winner: true,
        },
      });

      await tx.matchParticipant.update({
        where: { match_id_user_id: { match_id: matchId, user_id: loserId } },
        data: {
          status: PlayerMatchStatus.SUBMITTED_WA,
          score_change: loserChange,
          is_winner: false,
        },
      });

      await tx.user.update({
        where: { id: winnerId },
        data: { elo_rating: newWinnerElo, streak_count: newWinnerStreak, max_streak: newWinnerMaxStreak },
      });

      await tx.user.update({
        where: { id: loserId },
        data: { elo_rating: newLoserElo, streak_count: 0 },
      });

      const eloUpdates: Record<string, any> = {
        [winnerId]: { elo: newWinnerElo, change: winnerChange, streak: newWinnerStreak },
        [loserId]: { elo: newLoserElo, change: loserChange, streak: 0 },
      };

      return {
        matchId,
        winnerId,
        eloUpdates,
      };
    });
  }
}

export const matchRepository = new MatchRepository();
