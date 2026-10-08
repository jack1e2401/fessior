import { Router } from 'express';
import * as authController from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import { requireAuth } from './auth.middleware';

const router = Router();

router.post(
	'/register',
		validateRequest(registerSchema),
	authController.register
);

router.post(
	'/login',
		validateRequest(loginSchema),
	authController.login
);

router.post(
	'/logout',
		requireAuth,
	validateRequest(refreshTokenSchema),
	authController.logout
);

router.post(
	'/refresh',
		validateRequest(refreshTokenSchema),
	authController.refresh
);

router.get(
	'/me',
		requireAuth,
	authController.getMe
);

export default router;
