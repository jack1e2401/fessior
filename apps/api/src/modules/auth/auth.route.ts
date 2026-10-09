import { Router } from 'express';
import * as authController from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
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

router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.requestPasswordReset);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

router.get(
	'/me',
		requireAuth,
	authController.getMe
);

router.patch('/me', requireAuth, validateRequest(updateProfileSchema), authController.updateMe);

export default router;
