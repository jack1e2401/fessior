import { Request, Response, NextFunction } from 'express';
import { matchService } from './match.service';

export class MatchController {
  async getHistory(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await matchService.getHistory(userId, page, limit);
      res.status(200).json({
        status: 'Success',
        message: 'Success',
        data,
      });
    } catch (error: any) {
      res.status(400).json({ status: 'Error', message: error.message });
    }
  }

  async getActiveMatch(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const match = await matchService.getActiveMatch(userId);
      res.status(200).json({
        status: 'Success',
        message: 'Success',
        data: match,
      });
    } catch (error: any) {
      res.status(400).json({ status: 'Error', message: error.message });
    }
  }

  async getMatchDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = req.params.matchId as string;
      const match = await matchService.getMatchDetails(matchId, req.user.userId, req.user.role === 'ADMIN');
      res.status(200).json({
        status: 'Success',
        message: 'Success',
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMatch(req: Request, res: Response) {
    try {
      const matchId = req.params.matchId as string;
      await matchService.deleteMatch(matchId);
      res.status(200).json({
        status: 'Success',
        message: 'Match deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({ status: 'Error', message: error.message });
    }
  }
}

export const matchController = new MatchController();
