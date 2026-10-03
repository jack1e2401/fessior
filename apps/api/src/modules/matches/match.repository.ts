import { prisma } from '../../config/prisma';
import { MatchStatus, PlayerMatchStatus } from '@prisma/client';
import { calculateEloPvP } from './elo';

export class MatchRepository {
  async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [total, items] = await prisma.$transaction([
      prisma.match.count({
        where: {
          OR: [
            { player1_id: userId },
            { player2_id: userId },
            { participants: { some: { user_id: userId } } }
          ],
        },
      }),
      prisma.match.findMany({
        where: {
          OR: [
            { player1_id: userId },
            { player2_id: userId },
            { participants: { some: { user_id: userId } } }
          ],
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          player1: {
            select: { id: true, username: true, elo_rating: true, avatar_url: true },
          },
          player2: {
            select: { id: true, username: true, elo_rating: true, avatar_url: true },
          },
          participants: {
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
        player1: {
          select: { id: true, username: true, elo_rating: true, avatar_url: true },
        },
        player2: {
          select: { id: true, username: true, elo_rating: true, avatar_url: true },
        },
        participants: {
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
        OR: [
          { player1_id: userId },
          { player2_id: userId },
          { participants: { some: { user_id: userId } } }
        ],
      },
      include: {
        player1: {
          select: { id: true, username: true, elo_rating: true, avatar_url: true },
        },
        player2: {
          select: { id: true, username: true, elo_rating: true, avatar_url: true },
        },
        participants: {
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
    return prisma.match.create({
      data: {
        player1_id: data.player1Id,
        player2_id: data.player2Id,
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
      return prisma.match.findUnique({
        where: { id: matchId, status: MatchStatus.PENDING },
        include: { participants: true },
      });
    }

    if (problemId && userId) {
      return prisma.match.findFirst({
        where: {
          problem_id: problemId,
          status: MatchStatus.PENDING,
          OR: [
            { player1_id: userId },
            { player2_id: userId },
            { participants: { some: { user_id: userId } } },
          ],
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

  async endMatchWithEloTransaction(matchId: string, winnerId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { participants: true },
      });

      if (!match || match.status === MatchStatus.FINISHED) return null;
      if (!match.player1_id || !match.player2_id) return null;
      if (winnerId !== match.player1_id && winnerId !== match.player2_id) return null;

      const player1Id = match.player1_id;
      const player2Id = match.player2_id;
      const loserId = winnerId === player1Id ? player2Id : player1Id;

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
          player1_status: winnerId === player1Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
          player2_status: winnerId === player2Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
        },
      });

      await tx.matchParticipant.update({
        where: { match_id_user_id: { match_id: matchId, user_id: player1Id } },
        data: {
          status: winnerId === player1Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
          score_change: winnerId === player1Id ? winnerChange : loserChange,
          is_winner: winnerId === player1Id,
        },
      });

      await tx.matchParticipant.update({
        where: { match_id_user_id: { match_id: matchId, user_id: player2Id } },
        data: {
          status: winnerId === player2Id ? PlayerMatchStatus.ACCEPTED : PlayerMatchStatus.SUBMITTED_WA,
          score_change: winnerId === player2Id ? winnerChange : loserChange,
          is_winner: winnerId === player2Id,
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
