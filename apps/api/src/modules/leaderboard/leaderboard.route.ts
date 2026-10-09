import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { leaderboardRepository } from './leaderboard.repository';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const data = await leaderboardRepository.list(page, limit);
    res.status(200).json({ status: 'Success', data });
  } catch (error) { next(error); }
});

export default router;
