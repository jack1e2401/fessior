import { Server } from 'socket.io';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '@ocj/contracts';
import { matchRepository } from './match.repository';
import { AppError } from '../../errors/AppError';

export class MatchService {
  async reconcileAccepted(io: Server | null, matchId: string | null = null) {
    const candidates = await matchRepository.findUnsettledAccepted(50, matchId);
    for (const candidate of candidates) {
      await this.handleSubmissionUpdate(io, { ...candidate, status: 'ACCEPTED' });
    }
  }
  async getHistory(userId: string, page = 1, limit = 10) {
    return matchRepository.getHistory(userId, page, limit);
  }

  async getMatchDetails(matchId: string, userId: string, isAdmin = false) {
    const match = await matchRepository.findById(matchId);
    if (!match) {
      throw new AppError('Match not found', 404);
    }
    if (!isAdmin && !match.participants.some((participant) => participant.user_id === userId)) {
      throw new AppError('Forbidden: not a match participant', 403);
    }
    return match;
  }

  async canJoinMatch(matchId: string, userId: string) {
    return Boolean(await matchRepository.findParticipant(matchId, userId));
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
    if (!data.matchId) return;
    const stored = await matchRepository.findSubmissionForMatch(data.submissionId);
    if (!stored || stored.match_id !== data.matchId || stored.user_id !== data.userId ||
        stored.problem_id !== data.problemId || stored.status !== data.status) return;
    const activeMatch = await matchRepository.findActiveMatchForSubmission(data.matchId, data.problemId, data.userId);

    if (!activeMatch) return;

    if (data.status === 'ACCEPTED') {
      await this.endMatch(io, activeMatch.id, data.userId);
      return;
    }
    if (data.status === 'PENDING' || data.status === 'PROCESSING') return;
    await matchRepository.updateParticipantStatus(activeMatch.id, data.userId, 'SUBMITTED_WA');
    io?.to(SOCKET_ROOMS.match(activeMatch.id)).emit(SOCKET_EVENTS.RIVAL_SUBMISSION, {
      submissionId: data.submissionId, userId: data.userId, status: data.status,
      testCasesPassed: stored.test_cases_passed, testCasesTotal: stored.test_cases_total,
    });
  }

  async endMatch(io: Server | null, matchId: string, winnerId: string) {
    const result = await matchRepository.endMatchWithEloTransaction(matchId, winnerId);
    if (!result) return;

    try {
      io?.to(SOCKET_ROOMS.match(matchId)).emit(SOCKET_EVENTS.MATCH_ENDED, {
        matchId: result.matchId, winnerId: result.winnerId, eloUpdates: result.eloUpdates,
      });
    } catch (error) { console.error(`Match ended but realtime emit failed for ${matchId}`, error); }
  }

  async handleForfeit(io: Server | null, matchId: string, forfeitingUserId: string) {
    const match = await matchRepository.findById(matchId);
    if (!match) return false;

    if (match.participants.length !== 2) return false;
    if (!match.participants.some((participant) => participant.user_id === forfeitingUserId)) return false;
    const winnerId = match.participants.find((participant) => participant.user_id !== forfeitingUserId)?.user_id;
    if (!winnerId) return false;
    await this.endMatch(io, matchId, winnerId);
    return true;
  }
}

export const matchService = new MatchService();
