import { Router } from 'express';
import { matchController } from './match.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.get(
	'/history',
	requireAuth,
	matchController.getHistory
);

router.get(
	'/history/all',
	requireAuth,
	matchController.getAllHistory
);

router.get(
	'/leaderboard',
	requireAuth,
	matchController.getLeaderboard
);

router.get(
	'/active',
	requireAuth,
	matchController.getActiveMatch
);

router.get(
	'/:matchId',
	requireAuth,
	matchController.getMatchDetails
);

export default router;
