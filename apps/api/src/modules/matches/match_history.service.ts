import { matchHistoryRepository } from './match_history.repository';

export class MatchHistoryService {
  async getHistory(userId: string, page = 1, limit = 10) {
    return matchHistoryRepository.getHistory(userId, page, limit);
  }

  async getMatchDetails(matchId: string) {
    const match = await matchHistoryRepository.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }
    return match;
  }

  async getActiveMatch(userId: string) {
    return matchHistoryRepository.findActiveMatchByUserId(userId);
  }

  async deleteMatch(matchId: string) {
    const match = await matchHistoryRepository.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }
    await matchHistoryRepository.delete(matchId);
    return { success: true };
  }
}

export const matchHistoryService = new MatchHistoryService();
