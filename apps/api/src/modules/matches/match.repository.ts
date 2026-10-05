import { prisma } from '../../config/prisma';
import { MatchStatus, PlayerMatchStatus, Prisma } from '@prisma/client';
import { calculateEloPvP } from './elo';

export class MatchRepository {
  findUnsettledAccepted(take: number, matchId: string | null = null) {
    return prisma.$queryRaw<Array<{
      submissionId: string; userId: string; problemId: string; matchId: string;
      testCasesPassed: number; testCasesTotal: number;
    }>>`
      SELECT s.id AS submissionId, s.user_id AS userId, s.problem_id AS problemId,
             s.match_id AS matchId, s.test_cases_passed AS testCasesPassed,
             s.test_cases_total AS testCasesTotal
      FROM submissions s JOIN matches m ON m.id = s.match_id
      WHERE s.status = 'ACCEPTED' AND m.status = 'RUNNING'
        AND (${matchId} IS NULL OR m.id = ${matchId})
      ORDER BY s.updated_at ASC, s.id ASC LIMIT ${take}
    `;
  }
  findSubmissionForMatch(submissionId: string) {
    return prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, match_id: true, user_id: true, problem_id: true, status: true, test_cases_passed: true, test_cases_total: true },
    });
  }
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
        status: MatchStatus.RUNNING,
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
    const where: Prisma.ProblemWhereInput = {
      activeTestcaseSet: { is: { testcases: { some: {} } } },
    };
    const problemsCount = await prisma.problem.count({ where });
    if (problemsCount === 0) throw new Error('No judgeable problems found in database to match');

    const randomIndex = Math.floor(Math.random() * problemsCount);
    const problem = await prisma.problem.findFirst({ where, skip: randomIndex, orderBy: { id: 'asc' } });
    if (!problem) throw new Error('Failed to fetch matched problem');

    return problem;
  }

  async createMatch(data: { player1Id: string; player2Id: string; problemId: string }) {
    if (data.player1Id === data.player2Id) throw new Error('A 1v1 match requires two distinct users');
    return prisma.$transaction(async (tx) => {
      // Lock both user rows so concurrent creators cannot assign either player twice.
      await tx.$queryRaw`SELECT id FROM users WHERE id IN (${Prisma.join([data.player1Id, data.player2Id])}) ORDER BY id FOR UPDATE`;
      const active = await tx.match.count({
        where: { status: MatchStatus.RUNNING, participants: { some: { user_id: { in: [data.player1Id, data.player2Id] } } } },
      });
      if (active) throw new Error('A player is already in an active match');
      return tx.match.create({
      data: {
        problem_id: data.problemId,
        status: MatchStatus.RUNNING,
        participants: {
          create: [
            { user_id: data.player1Id, status: PlayerMatchStatus.CODING, score_change: 0, is_winner: false },
            { user_id: data.player2Id, status: PlayerMatchStatus.CODING, score_change: 0, is_winner: false },
          ],
        },
      },
    });
    });
  }

  async findActiveMatchForSubmission(matchId: string, problemId: string, userId: string) {
    return prisma.match.findFirst({
      where: {
        id: matchId, problem_id: problemId, status: MatchStatus.RUNNING,
        participants: { some: { user_id: userId } },
      },
      include: { participants: true },
    });
  }

  async updateParticipantStatus(matchId: string, userId: string, status: PlayerMatchStatus) {
    return prisma.matchParticipant.updateMany({
      where: { match_id: matchId, user_id: userId, match: { status: MatchStatus.RUNNING } },
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

      if (!match || match.status !== MatchStatus.RUNNING) return null;
      if (match.participants.length !== 2) return null;
      if (!match.participants.some((participant) => participant.user_id === winnerId)) return null;
      const loserId = match.participants.find((participant) => participant.user_id !== winnerId)?.user_id;
      if (!loserId) return null;

      const claimed = await tx.match.updateMany({
        where: { id: matchId, status: MatchStatus.RUNNING },
        data: { status: MatchStatus.FINISHED, winner_id: winnerId },
      });
      if (claimed.count !== 1) return null;

      const winner = await tx.user.findUnique({ where: { id: winnerId } });
      const loser = await tx.user.findUnique({ where: { id: loserId } });

      if (!winner || !loser) throw new Error('Match participant user is missing');

      const { newWinnerElo, newLoserElo, winnerChange, loserChange } = calculateEloPvP(
        winner.elo_rating,
        loser.elo_rating
      );

      const newWinnerStreak = winner.streak_count + 1;
      const newWinnerMaxStreak = Math.max(winner.max_streak, newWinnerStreak);

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
