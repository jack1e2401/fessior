import { Router } from 'express';
import { testcaseController } from './testcase.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createTestcaseSchema } from './testcase.schema';

const router = Router({ mergeParams: true });
export const testcaseSetRouter = Router({ mergeParams: true });
testcaseSetRouter.post('/import', requireAuth, requireAdmin, testcaseController.importArchive);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest(createTestcaseSchema),
  testcaseController.addTestcase
);

router.get(
  '/',
  requireAuth,
  testcaseController.getTestcases
);

router.delete(
  '/:testcaseId',
  requireAuth,
  requireAdmin,
  testcaseController.deleteTestcase
);

export default router;
