import { Router } from 'express';
import { matchController } from './match.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';

const router = Router();

router.get(
	'/history',
	requireAuth,
	matchController.getHistory
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

router.delete(
	'/:matchId',
	requireAuth,
	requireAdmin,
	matchController.deleteMatch
);

export default router;
