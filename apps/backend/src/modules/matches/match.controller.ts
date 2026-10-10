import { Request, Response, NextFunction } from 'express';
import { matchService } from './match.service';

export class MatchController {
  async getHistory(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
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

  async getAllHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
      const data = await matchService.getAllHistory(page, limit);
      res.status(200).json({ status: 'Success', message: 'Success', data });
    } catch (error) { next(error); }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
      const data = await matchService.getLeaderboard(page, limit);
      res.status(200).json({ status: 'Success', message: 'Success', data });
    } catch (error) { next(error); }
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

}

export const matchController = new MatchController();
