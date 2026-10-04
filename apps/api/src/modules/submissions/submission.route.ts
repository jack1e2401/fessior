import { Router } from 'express';
import { submissionController } from './submission.controller';
import { requireAuth } from '../auth/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { submitCodeSchema } from './submission.schema';

const router = Router();

router.use(requireAuth);

router.post(
	'/',
	validateRequest(submitCodeSchema),
	submissionController.submit
);

router.post(
	'/run',
	submissionController.runCode
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
