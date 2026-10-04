import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { updateMeSchema, adminUpdateUserSchema, updateRoleSchema, banUserSchema } from './user.schema';
import * as userController from './user.controller';

const router = Router();

/**
 * GET /api/v1/users/:username
 * Get public user profile by username
 */
router.get('/profile/:username', (req, res, next) => {
    userController.getUserByUsername(req, res, next);
});

// Keep the literal /me route ahead of the public username parameter route.
router.get('/me/submissions', requireAuth, (req, res, next) => {
    userController.getUserSubmissions(req, res, next);
});

// GET /api/v1/users/:username/submissions - Get public submissions by username
router.get('/:username/submissions', (req, res, next) => {
    userController.getUserSubmissionsByUsername(req, res, next);
});

// GET /api/v1/users - Get all users (Admin only)
router.get('/', requireAuth, requireAdmin, (req, res, next) => {
    userController.getAllUsers(req, res, next);
});

router.use(requireAuth);

/**
 * GET /api/v1/users/me
 * Get current user profile
 */
router.get('/me', (req, res, next) => {
    userController.getMe(req, res, next);
});

/**
 * PATCH /api/v1/users/me
 * Update current user profile
 */
router.patch('/me', validateRequest(updateMeSchema), (req, res, next) => {
    userController.updateMe(req, res, next);
});

// GET /api/v1/users/me/elo-history - Get user ELO history
router.get('/me/elo-history', (req, res, next) => {
    userController.getUserEloHistory(req, res, next);
});

// GET /api/v1/users/me/streak - Get user streak and heatmap
router.get('/me/streak', (req, res, next) => {
    userController.getUserStreak(req, res, next);
});

// GET /api/v1/users/:id - Get user by ID (Admin only)
router.get('/:id', requireAuth, requireAdmin, (req, res, next) => {
    userController.getUserByIdAdmin(req, res, next);
});

// PATCH /api/v1/users/:id - Admin update user
router.patch('/:id', requireAuth, requireAdmin, validateRequest(adminUpdateUserSchema), (req, res, next) => {
    userController.adminUpdateUser(req, res, next);
});

// PATCH /api/v1/users/:id/role - Admin update user role
router.patch('/:id/role', requireAuth, requireAdmin, validateRequest(updateRoleSchema), (req, res, next) => {
    userController.updateUserRole(req, res, next);
});

// POST /api/v1/users/:id/ban - Admin ban user
router.post('/:id/ban', requireAuth, requireAdmin, validateRequest(banUserSchema), (req, res, next) => {
    userController.banUser(req, res, next);
});

// POST /api/v1/users/:id/unban - Admin unban user
router.post('/:id/unban', requireAuth, requireAdmin, (req, res, next) => {
    userController.unbanUser(req, res, next);
});

router.get('/profile/:username/elo-history', (req, res, next) => {
    userController.getUserEloHistoryByUsername(req, res, next);
});

router.get('/profile/:username/streak', (req, res, next) => {
    userController.getUserStreakByUsername(req, res, next);
});

export default router;
