import { Router } from 'express';
import { submissionController } from './submission.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { runCodeSchema, submitCodeSchema } from './submission.schema';

const router = Router();

router.use(requireAuth);

router.post(
	'/',
	validateRequest(submitCodeSchema),
	submissionController.submit
);

router.post(
	'/run',
	validateRequest(runCodeSchema),
	submissionController.runCode
);

router.get(
	'/admin',
	requireAdmin,
	submissionController.getAdminSubmissions
);

router.get(
	'/',
	submissionController.getUserSubmissions
);

router.get(
	'/:id',
	submissionController.getSubmissionDetails
);

export default router;
