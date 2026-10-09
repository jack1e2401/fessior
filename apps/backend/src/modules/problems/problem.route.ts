import { Router } from 'express';
import { problemController } from './problem.controller';
import { requireAuth, requireAdmin, optionalAuth } from '../auth/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createProblemSchema,
  updateProblemSchema,
} from './problem.schema';

const router = Router();

// Problems
router.get(
  '/',
  optionalAuth,
  problemController.listProblems
);

router.get(
  '/:slug',
  problemController.getProblem
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest(createProblemSchema),
  problemController.createProblem
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateRequest(updateProblemSchema),
  problemController.updateProblem
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  problemController.deleteProblem
);

export default router;
