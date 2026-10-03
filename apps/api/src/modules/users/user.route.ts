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
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get public user profile'
     #swagger.description = 'Returns public profile information of a user by username. Does not require authentication.'
     #swagger.parameters['username'] = {
       in: 'path',
       required: true,
       description: 'Username of the user to retrieve',
       type: 'string',
       example: 'john_doe'
     }
     #swagger.responses[200] = {
       description: 'User profile retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string', example: 'User profile retrieved successfully' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string' },
                   username: { type: 'string' },
                   avatar_url: { type: 'string', nullable: true },
                   role: { type: 'string', enum: ['USER', 'ADMIN'] },
                   elo_rating: { type: 'number' },
                   streak_count: { type: 'number' },
                   max_streak: { type: 'number' },
                   code_coins: { type: 'number' },
                   bio: { type: 'string', nullable: true },
                   full_name: { type: 'string', nullable: true },
                   created_at: { type: 'string', format: 'date-time' }
                 }
               }
             }
           },
           example: {
             status: 'Success',
             message: 'User profile retrieved successfully',
             data: {
               id: 'uuid-123',
               username: 'john_doe',
               avatar_url: null,
               role: 'USER',
               elo_rating: 1200,
               streak_count: 5,
               max_streak: 10,
               code_coins: 100,
               bio: 'I love coding!',
               full_name: 'John Doe',
               created_at: '2024-01-01T00:00:00.000Z'
             }
           }
         }
       }
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
  */
  userController.getUserByUsername(req, res, next);
});

// GET /api/v1/users/:username/submissions - Get public submissions by username
router.get('/:username/submissions', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get public submissions by username'
     #swagger.description = 'Returns paginated list of accepted submissions by a specific user (code is hidden).'
     #swagger.parameters['username'] = {
       in: 'path',
       required: true,
       description: 'Username',
       type: 'string',
       example: 'khankh'
     }
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Page number (default: 1)',
       type: 'integer',
       example: 1
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Items per page (default: 10)',
       type: 'integer',
       example: 10
     }
     #swagger.responses[200] = {
       description: 'User submissions retrieved successfully'
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
  */
  userController.getUserSubmissionsByUsername(req, res, next);
});

// GET /api/v1/users/:username/tag-stats - Get public tag stats by username
router.get('/:username/tag-stats', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get public tag statistics by username'
     #swagger.description = 'Returns number of problems solved by tag for a specific user.'
     #swagger.parameters['username'] = {
       in: 'path',
       required: true,
       description: 'Username',
       type: 'string',
       example: 'khankh'
     }
     #swagger.responses[200] = {
       description: 'User tag statistics retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   username: { type: 'string' },
                   tag_stats: {
                     type: 'array',
                     items: {
                       type: 'object',
                       properties: {
                         tag_id: { type: 'string' },
                         tag_name: { type: 'string' },
                         tag_slug: { type: 'string' },
                         tag_color: { type: 'string', nullable: true },
                         problems_solved: { type: 'number' }
                       }
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
  */
  userController.getUserTagStatsByUsername(req, res, next);
});

// GET /api/v1/users - Get all users (Admin only)
router.get('/', requireAuth, requireAdmin, (req, res, next) => {
  /* #swagger.tags = ['Admin']
     #swagger.summary = 'Get all users (Admin only)'
     #swagger.description = 'Returns paginated list of all users with search and filter capabilities.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Page number (default: 1)',
       type: 'integer',
       example: 1
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Items per page (default: 10)',
       type: 'integer',
       example: 10
     }
     #swagger.parameters['search'] = {
       in: 'query',
       description: 'Search by username, email, or full name',
       type: 'string',
       example: 'john'
     }
     #swagger.responses[200] = {
       description: 'Users retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   users: { type: 'array', items: { type: 'object' } },
                   pagination: {
                     type: 'object',
                     properties: {
                       page: { type: 'number' },
                       limit: { type: 'number' },
                       total: { type: 'number' },
                       totalPages: { type: 'number' }
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[403] = {
       description: 'Forbidden - Admin access required'
     }
  */
  userController.getAllUsers(req, res, next);
});

router.use(requireAuth);

/**
 * GET /api/v1/users/me
 * Get current user profile
 */
router.get('/me', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get current user profile'
     #swagger.description = 'Returns the profile information of the authenticated user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = {
       description: 'User profile retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string', example: 'User profile retrieved successfully' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string' },
                   username: { type: 'string' },
                   email: { type: 'string' },
                   avatar_url: { type: 'string', nullable: true },
                   role: { type: 'string', enum: ['USER', 'ADMIN'] },
                   elo_rating: { type: 'number' },
                   streak_count: { type: 'number' },
                   max_streak: { type: 'number' },
                   code_coins: { type: 'number' },
                   bio: { type: 'string', nullable: true },
                   full_name: { type: 'string', nullable: true },
                   created_at: { type: 'string', format: 'date-time' }
                 }
               }
             }
           },
           example: {
             status: 'Success',
             message: 'User profile retrieved successfully',
             data: {
               id: 'uuid-123',
               username: 'john_doe',
               email: 'john@example.com',
               avatar_url: null,
               role: 'USER',
               elo_rating: 1200,
               streak_count: 5,
               max_streak: 10,
               code_coins: 100,
               bio: 'I love coding',
               full_name: 'John Doe',
               created_at: '2024-01-01T00:00:00.000Z'
             }
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: 'Unauthorized - Invalid or missing token'
     }
  */
  userController.getMe(req, res, next);
});

/**
 * PATCH /api/v1/users/me
 * Update current user profile
 */
router.patch('/me', validateRequest(updateMeSchema), (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Update current user profile'
     #swagger.description = 'Updates the profile information (full_name, bio) of the authenticated user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               full_name: { type: 'string', maxLength: 100, description: 'User full name', example: 'John Doe' },
               bio: { type: 'string', maxLength: 500, description: 'Short biography', example: 'I love coding and solving problems!' }
             }
           },
           example: {
             full_name: 'John Doe',
             bio: 'I love coding and solving problems!'
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: 'User profile updated successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string', example: 'User profile updated successfully' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string' },
                   username: { type: 'string' },
                   email: { type: 'string' },
                   avatar_url: { type: 'string', nullable: true },
                   role: { type: 'string', enum: ['USER', 'ADMIN'] },
                   elo_rating: { type: 'number' },
                   streak_count: { type: 'number' },
                   max_streak: { type: 'number' },
                   code_coins: { type: 'number' },
                   bio: { type: 'string', nullable: true },
                   full_name: { type: 'string', nullable: true },
                   created_at: { type: 'string', format: 'date-time' },
                   updated_at: { type: 'string', format: 'date-time' }
                 }
               }
             }
           },
           example: {
             status: 'Success',
             message: 'User profile updated successfully',
             data: {
               id: 'uuid-123',
               username: 'john_doe',
               email: 'john@example.com',
               avatar_url: null,
               role: 'USER',
               elo_rating: 1200,
               streak_count: 5,
               max_streak: 10,
               code_coins: 100,
               bio: 'I love coding and solving problems!',
               full_name: 'John Doe',
               created_at: '2024-01-01T00:00:00.000Z',
               updated_at: '2024-01-15T00:00:00.000Z'
             }
           }
         }
       }
     }
     #swagger.responses[400] = {
       description: 'Validation error - Invalid input data'
     }
     #swagger.responses[401] = {
       description: 'Unauthorized - Invalid or missing token'
     }
  */
  userController.updateMe(req, res, next);
});

// GET /api/v1/users/me/submissions - Get user submissions
router.get('/me/submissions', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get current user submissions'
     #swagger.description = 'Returns paginated list of code submissions by the authenticated user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Page number (default: 1)',
       type: 'integer',
       example: 1
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Items per page (default: 10)',
       type: 'integer',
       example: 10
     }
     #swagger.responses[200] = {
       description: 'User submissions retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   submissions: { 
                     type: 'array', 
                     items: { 
                       type: 'object',
                       properties: {
                         _id: { type: 'string' },
                         userId: { type: 'string' },
                         problemId: { type: 'object' },
                         code: { type: 'string' },
                         language: { type: 'string', enum: ['cpp', 'java', 'python'] },
                         status: { type: 'string' },
                         executionTime: { type: 'number' },
                         memoryUsed: { type: 'number' },
                         testCasesPassed: { type: 'number' },
                         testCasesTotal: { type: 'number' },
                         createdAt: { type: 'string', format: 'date-time' }
                       }
                     }
                   },
                   pagination: {
                     type: 'object',
                     properties: {
                       page: { type: 'number' },
                       limit: { type: 'number' },
                       total: { type: 'number' },
                       totalPages: { type: 'number' }
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: 'Unauthorized'
     }
  */
  userController.getUserSubmissions(req, res, next);
});

// GET /api/v1/users/me/badges - Get user badges
router.get('/me/badges', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get current user badges'
     #swagger.description = 'Returns list of badges that the authenticated user has earned.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = {
       description: 'User badges retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string', example: 'User badges retrieved successfully' },
               data: {
                 type: 'array',
                 items: {
                   type: 'object',
                   properties: {
                     id: { type: 'string' },
                     name: { type: 'string' },
                     slug: { type: 'string' },
                     description: { type: 'string', nullable: true },
                     icon_url: { type: 'string', nullable: true },
                     type: { type: 'string', enum: ['ACHIEVEMENT', 'STREAK', 'CONTEST', 'RANKING'] },
                     earned_at: { type: 'string', format: 'date-time' }
                   }
                 }
               }
             }
           },
           example: {
             status: 'Success',
             message: 'User badges retrieved successfully',
             data: [
               {
                 id: 'badge-id-1',
                 name: '100 Problems Solved',
                 slug: '100-problems',
                 description: 'Solved 100 problems',
                 icon_url: null,
                 type: 'ACHIEVEMENT',
                 earned_at: '2024-01-15T00:00:00.000Z'
               }
             ]
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: 'Unauthorized'
     }
  */
  userController.getUserBadges(req, res, next);
});

// GET /api/v1/users/me/tag-stats - Get user tag statistics
router.get('/me/tag-stats', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get current user tag statistics'
     #swagger.description = 'Returns number of problems solved by the authenticated user, grouped by tag.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = {
       description: 'User tag statistics retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string', example: 'User tag statistics retrieved successfully' },
               data: {
                 type: 'array',
                 items: {
                   type: 'object',
                   properties: {
                     tag_id: { type: 'string' },
                     tag_name: { type: 'string' },
                     tag_slug: { type: 'string' },
                     tag_color: { type: 'string', nullable: true },
                     problems_solved: { type: 'number' }
                   }
                 }
               }
             }
           },
           example: {
             status: 'Success',
             message: 'User tag statistics retrieved successfully',
             data: [
               {
                 tag_id: 'tag-id-1',
                 tag_name: 'Array',
                 tag_slug: 'array',
                 tag_color: '#FF0000',
                 problems_solved: 15
               },
               {
                 tag_id: 'tag-id-2',
                 tag_name: 'Dynamic Programming',
                 tag_slug: 'dp',
                 tag_color: '#00FF00',
                 problems_solved: 8
               }
             ]
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: 'Unauthorized'
     }
  */
  userController.getUserTagStats(req, res, next);
});

// GET /api/v1/users/me/elo-history - Get user ELO history
router.get('/me/elo-history', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get current user ELO history'
     #swagger.description = 'Returns paginated history of ELO rating changes for the authenticated user.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Page number (default: 1)',
       type: 'integer',
       example: 1
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Items per page (default: 10)',
       type: 'integer',
       example: 10
     }
     #swagger.responses[200] = {
       description: 'User ELO history retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   history: {
                     type: 'array',
                     items: {
                       type: 'object',
                       properties: {
                         id: { type: 'string' },
                         old_elo: { type: 'number' },
                         new_elo: { type: 'number' },
                         change: { type: 'number' },
                         reason: { type: 'string' },
                         match_id: { type: 'string', nullable: true },
                         created_at: { type: 'string', format: 'date-time' }
                       }
                     }
                   },
                   pagination: {
                     type: 'object',
                     properties: {
                       page: { type: 'number' },
                       limit: { type: 'number' },
                       total: { type: 'number' },
                       totalPages: { type: 'number' }
                     }
                   }
                 }
               }
             }
           },
           example: {
             status: 'Success',
             message: 'User ELO history retrieved successfully',
             data: {
               history: [
                 {
                   id: 'history-id-1',
                   old_elo: 1200,
                   new_elo: 1225,
                   change: 25,
                   reason: 'MATCH_WIN',
                   match_id: 'match-123',
                   created_at: '2024-01-15T00:00:00.000Z'
                 }
               ],
               pagination: {
                 page: 1,
                 limit: 10,
                 total: 1,
                 totalPages: 1
               }
             }
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: 'Unauthorized'
     }
  */
  userController.getUserEloHistory(req, res, next);
});

// GET /api/v1/users/me/streak - Get user streak and heatmap
router.get('/me/streak', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get current user streak and heatmap'
     #swagger.description = 'Returns current streak, max streak, and calendar heatmap of problem-solving activity for the last 365 days.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = {
       description: 'User streak and heatmap retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   current_streak: { type: 'number', example: 5 },
                   max_streak: { type: 'number', example: 10 },
                   last_active_date: { type: 'string', format: 'date', nullable: true },
                   heatmap: {
                     type: 'object',
                     additionalProperties: { type: 'number' },
                     description: 'Map of date (YYYY-MM-DD) to number of problems solved',
                     example: { "2024-01-15": 3, "2024-01-16": 1 }
                   }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[401] = {
       description: 'Unauthorized'
     }
  */
  userController.getUserStreak(req, res, next);
});

// GET /api/v1/users/:id - Get user by ID (Admin only)
router.get('/:id', requireAuth, requireAdmin, (req, res, next) => {
  /* #swagger.tags = ['Admin']
     #swagger.summary = 'Get user by ID (Admin only)'
     #swagger.description = 'Returns detailed information of a specific user including email and ban status.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       required: true,
       description: 'User ID',
       type: 'string',
       example: 'uuid-123'
     }
     #swagger.responses[200] = {
       description: 'User retrieved successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string' },
                   username: { type: 'string' },
                   email: { type: 'string' },
                   avatar_url: { type: 'string', nullable: true },
                   role: { type: 'string', enum: ['USER', 'ADMIN'] },
                   elo_rating: { type: 'number' },
                   streak_count: { type: 'number' },
                   max_streak: { type: 'number' },
                   code_coins: { type: 'number' },
                   bio: { type: 'string', nullable: true },
                   full_name: { type: 'string', nullable: true },
                   is_banned: { type: 'boolean' },
                   banned_at: { type: 'string', nullable: true },
                   banned_reason: { type: 'string', nullable: true },
                   last_active_date: { type: 'string', nullable: true },
                   created_at: { type: 'string', format: 'date-time' },
                   updated_at: { type: 'string', format: 'date-time' }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
     #swagger.responses[403] = {
       description: 'Forbidden - Admin access required'
     }
  */
  userController.getUserByIdAdmin(req, res, next);
});

// PATCH /api/v1/users/:id - Admin update user
router.patch('/:id', requireAuth, requireAdmin, validateRequest(adminUpdateUserSchema), (req, res, next) => {
  /* #swagger.tags = ['Admin']
     #swagger.summary = 'Admin update user'
     #swagger.description = 'Allows admin to update user information (username, email, full_name, bio, elo_rating, code_coins).'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       required: true,
       description: 'User ID',
       type: 'string'
     }
     #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               username: { type: 'string', example: 'new_username' },
               email: { type: 'string', example: 'newemail@example.com' },
               full_name: { type: 'string', example: 'New Full Name' },
               bio: { type: 'string', example: 'Updated bio' },
               elo_rating: { type: 'number', example: 1500 },
               code_coins: { type: 'number', example: 500 }
             }
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: 'User updated successfully'
     }
     #swagger.responses[403] = {
       description: 'Forbidden - Admin access required'
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
  */
  userController.adminUpdateUser(req, res, next);
});

// PATCH /api/v1/users/:id/role - Admin update user role
router.patch('/:id/role', requireAuth, requireAdmin, validateRequest(updateRoleSchema), (req, res, next) => {
  /* #swagger.tags = ['Admin']
     #swagger.summary = 'Admin update user role'
     #swagger.description = 'Allows admin to change a user\'s role between USER and ADMIN.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       required: true,
       description: 'User ID',
       type: 'string'
     }
     #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' }
             },
             required: ['role']
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: 'User role updated successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string' },
                   username: { type: 'string' },
                   email: { type: 'string' },
                   role: { type: 'string' },
                   updated_at: { type: 'string' }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[403] = {
       description: 'Forbidden - Admin access required'
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
  */
  userController.updateUserRole(req, res, next);
});

// POST /api/v1/users/:id/ban - Admin ban user
router.post('/:id/ban', requireAuth, requireAdmin, validateRequest(banUserSchema), (req, res, next) => {
  /* #swagger.tags = ['Admin']
     #swagger.summary = 'Admin ban user'
     #swagger.description = 'Locks a user account. Banned users cannot authenticate or access protected APIs.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       required: true,
       description: 'User ID',
       type: 'string'
     }
     #swagger.requestBody = {
       required: false,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               reason: { type: 'string', example: 'Violation of community guidelines' }
             }
           }
         }
       }
     }
     #swagger.responses[200] = {
       description: 'User banned successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string' },
                   username: { type: 'string' },
                   email: { type: 'string' },
                   is_banned: { type: 'boolean' },
                   banned_at: { type: 'string' },
                   banned_reason: { type: 'string', nullable: true }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[400] = {
       description: 'User is already banned'
     }
     #swagger.responses[403] = {
       description: 'Forbidden - Admin access required'
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
  */
  userController.banUser(req, res, next);
});

// POST /api/v1/users/:id/unban - Admin unban user
router.post('/:id/unban', requireAuth, requireAdmin, (req, res, next) => {
  /* #swagger.tags = ['Admin']
     #swagger.summary = 'Admin unban user'
     #swagger.description = 'Restores a banned user account. User can login and access protected APIs again.'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = {
       in: 'path',
       required: true,
       description: 'User ID',
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'User unbanned successfully',
       content: {
         'application/json': {
           schema: {
             type: 'object',
             properties: {
               status: { type: 'string', example: 'Success' },
               message: { type: 'string' },
               data: {
                 type: 'object',
                 properties: {
                   id: { type: 'string' },
                   username: { type: 'string' },
                   email: { type: 'string' },
                   is_banned: { type: 'boolean' },
                   banned_at: { type: 'string', nullable: true },
                   banned_reason: { type: 'string', nullable: true }
                 }
               }
             }
           }
         }
       }
     }
     #swagger.responses[400] = {
       description: 'User is not banned'
     }
     #swagger.responses[403] = {
       description: 'Forbidden - Admin access required'
     }
     #swagger.responses[404] = {
       description: 'User not found'
     }
  */
  userController.unbanUser(req, res, next);
});

router.get('/profile/:username/elo-history', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get public user elo history by username'
     #swagger.description = 'Returns paginated elo history for a specific user.'
  */
  userController.getUserEloHistoryByUsername(req, res, next);
});

router.get('/profile/:username/streak', (req, res, next) => {
  /* #swagger.tags = ['User']
     #swagger.summary = 'Get public user streak by username'
     #swagger.description = 'Returns streak count and heatmap for a specific user.'
  */
  userController.getUserStreakByUsername(req, res, next);
});

export default router;
