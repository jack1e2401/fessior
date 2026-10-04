import { Server } from 'socket.io';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '@ocj/contracts';
import { matchRepository } from './match.repository';

export class MatchService {
  async getHistory(userId: string, page = 1, limit = 10) {
    return matchRepository.getHistory(userId, page, limit);
  }

  async getMatchDetails(matchId: string) {
    const match = await matchRepository.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }
    return match;
  }

  async getActiveMatch(userId: string) {
    return matchRepository.findActiveMatchByUserId(userId);
  }

  async deleteMatch(matchId: string) {
    const match = await matchRepository.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }
    await matchRepository.delete(matchId);
    return { success: true };
  }

  async handleSubmissionUpdate(
    io: Server | null,
    data: {
      submissionId: string;
      userId: string;
      problemId: string;
      status: string;
      testCasesPassed: number;
      testCasesTotal: number;
      matchId?: string;
    }
  ) {
    const activeMatch = await matchRepository.findActiveMatchForSubmission(
      data.matchId,
      data.problemId,
      data.userId
    );

    if (!activeMatch) return;

    const roomName = SOCKET_ROOMS.match(activeMatch.id);

    io?.to(roomName).emit(SOCKET_EVENTS.RIVAL_SUBMISSION, {
      userId: data.userId,
      status: data.status,
      testCasesPassed: data.testCasesPassed,
      testCasesTotal: data.testCasesTotal,
    });

    if (activeMatch.participants.some((participant) => participant.user_id === data.userId)) {
      const isAC = data.status === 'ACCEPTED';
      const newStatus = isAC ? 'ACCEPTED' : 'SUBMITTED_WA';
      await matchRepository.updateParticipantStatus(activeMatch.id, data.userId, newStatus);
    }

    if (data.status === 'ACCEPTED') {
      await this.endMatch(io, activeMatch.id, data.userId);
    }
  }

  async endMatch(io: Server | null, matchId: string, winnerId: string) {
    const result = await matchRepository.endMatchWithEloTransaction(matchId, winnerId);
    if (!result) return;

    io?.to(SOCKET_ROOMS.match(matchId)).emit(SOCKET_EVENTS.MATCH_ENDED, {
      matchId: result.matchId,
      winnerId: result.winnerId,
      eloUpdates: result.eloUpdates,
    });
  }

  async handleForfeit(io: Server | null, matchId: string, forfeitingUserId: string) {
    const match = await matchRepository.findById(matchId);
    if (!match) return;

    if (match.participants.length !== 2) return;
    if (!match.participants.some((participant) => participant.user_id === forfeitingUserId)) return;
    const winnerId = match.participants.find((participant) => participant.user_id !== forfeitingUserId)?.user_id;
    if (!winnerId) return;
    await this.endMatch(io, matchId, winnerId);
  }
}

export const matchService = new MatchService();
