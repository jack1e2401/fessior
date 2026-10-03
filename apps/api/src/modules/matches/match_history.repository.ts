import { prisma } from '../../config/prisma';
import { MatchStatus } from '@prisma/client';

export class MatchHistoryRepository {
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
}

export const matchHistoryRepository = new MatchHistoryRepository();
