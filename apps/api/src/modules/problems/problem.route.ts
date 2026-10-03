import { Router } from 'express';
import { problemController } from './problem.controller';
import { requireAuth, requireAdmin, optionalAuth } from '../auth/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createProblemSchema,
  updateProblemSchema,
} from './problem.schema';

const router = Router();

// Tags
router.get(
  '/tags',
/* #swagger.tags = ['Problems']
   #swagger.summary = 'List available tags'
   #swagger.description = 'Return all available problem tags used for filtering and categorization.'
   #swagger.responses[200] = {
     description: 'Tags list',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Tags fetched',
           data: ['arrays', 'dp']
         }
       }
     }
   }
*/
  problemController.getTags
);

router.post(
  '/tags',
/* #swagger.tags = ['Problems']
   #swagger.summary = 'Create a tag (admin)'
   #swagger.description = 'Create a new problem tag. Requires admin privileges.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.requestBody = {
     required: true,
     content: {
       'application/json': {
         schema: {
           type: 'object',
           properties: {
             name: { type: 'string' }
           },
           required: ['name']
         },
         example: {
           name: 'graphs'
         }
       }
     }
   }
   #swagger.responses[201] = {
     description: 'Tag created',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Tag created',
           data: {
             name: 'graphs'
           }
         }
       }
     }
   }
*/
  requireAuth,
  requireAdmin,
  problemController.createTag
);

// Problems
// Problems
router.get(
  '/',
/* #swagger.tags = ['Problems']
   #swagger.summary = 'List problems (with pagination and filters)'
   #swagger.description = 'Return paginated list of problems with optional filters: tag, difficulty, search.'
   #swagger.parameters['page'] = {
     in: 'query',
     schema: {
       type: 'integer',
       default: 1
     },
     description: 'Page number'
   }
   #swagger.parameters['limit'] = {
     in: 'query',
     schema: {
       type: 'integer',
       default: 20
     },
     description: 'Items per page'
   }
   #swagger.parameters['tag'] = {
     in: 'query',
     schema: {
       type: 'string'
     },
     description: 'Filter by tag'
   }
   #swagger.parameters['difficulty'] = {
     in: 'query',
     schema: {
       type: 'string',
       enum: ['EASY', 'MEDIUM', 'HARD']
     },
     description: 'Filter by difficulty'
   }
   #swagger.parameters['q'] = {
     in: 'query',
     schema: {
       type: 'string'
     },
     description: 'Full-text search query'
   }
   #swagger.responses[200] = {
     description: 'Problems list',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Problems fetched',
           data: {
             items: [
               {
                 id: 'prob_1',
                 slug: 'two-sum',
                 title: 'Two Sum',
                 difficulty: 'EASY',
                 tags: ['arrays']
               }
             ],
             total: 1,
             page: 1,
             limit: 20
           }
         }
       }
     }
   }
*/
  optionalAuth,
  problemController.listProblems
);

router.get(
  '/:slug',
/* #swagger.tags = ['Problems']
   #swagger.summary = 'Get problem details by slug'
   #swagger.parameters['slug'] = {
     in: 'path',
     required: true,
     schema: { type: 'string' }
   }
   #swagger.responses[200] = {
     description: 'Problem details',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Problem fetched',
           data: {
             id: 'prob_1',
             slug: 'two-sum',
             title: 'Two Sum',
             description: 'Given an array...',
             difficulty: 'EASY',
             tags: ['arrays']
           }
         }
       }
     }
   }
*/
  problemController.getProblem
);

router.post(
  '/',
/* #swagger.tags = ['Problems']
   #swagger.summary = 'Create a new problem (admin)'
   #swagger.description = 'Create a problem including statement, tags, difficulty and metadata. Admin only.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.requestBody = {
     required: true,
     content: {
       'application/json': {
         schema: {
           type: 'object',
           properties: {
             title: { type: 'string' },
             slug: { type: 'string' },
             description: { type: 'string' },
             difficulty: {
               type: 'string',
               enum: ['EASY', 'MEDIUM', 'HARD']
             },
             tags: {
               type: 'array',
               items: { type: 'string' }
             },
             timeLimitMs: { type: 'integer' },
             memoryLimitMb: { type: 'integer' }
           },
           required: ['title', 'slug', 'description']
         },
         example: {
           title: 'Two Sum',
           slug: 'two-sum',
           description: 'Find two numbers...',
           difficulty: 'EASY',
           tags: ['arrays'],
           timeLimitMs: 1000,
           memoryLimitMb: 256
         }
       }
     }
   }
   #swagger.responses[201] = {
     description: 'Problem created',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Problem created',
           data: {
             id: 'prob_1',
             slug: 'two-sum',
             title: 'Two Sum'
           }
         }
       }
     }
   }
*/
  requireAuth,
  requireAdmin,
  validateRequest(createProblemSchema),
  problemController.createProblem
);

router.put(
  '/:id',
/* #swagger.tags = ['Problems']
   #swagger.summary = 'Update problem (admin)'
   #swagger.description = 'Update problem metadata and statement. Admin only.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.parameters['id'] = {
     in: 'path',
     required: true,
     schema: { type: 'string' }
   }
   #swagger.requestBody = {
     required: true,
     content: {
       'application/json': {
         schema: {
           type: 'object',
           properties: {
             title: { type: 'string' },
             description: { type: 'string' },
             difficulty: {
               type: 'string',
               enum: ['EASY', 'MEDIUM', 'HARD']
             },
             tags: {
               type: 'array',
               items: { type: 'string' }
             }
           },
           example: {
             title: 'Two Sum (updated)',
             description: 'Updated statement'
           }
         }
       }
     }
   }
   #swagger.responses[200] = {
     description: 'Problem updated',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Problem updated',
           data: {
             id: 'prob_1',
             title: 'Two Sum (updated)'
           }
         }
       }
     }
   }
*/
  requireAuth,
  requireAdmin,
  validateRequest(updateProblemSchema),
  problemController.updateProblem
);

router.delete(
  '/:id',
/* #swagger.tags = ['Problems']
   #swagger.summary = 'Delete problem (admin)'
   #swagger.description = 'Remove a problem and associated testcases. Admin only.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.parameters['id'] = {
     in: 'path',
     required: true,
     schema: { type: 'string' }
   }
   #swagger.responses[200] = {
     description: 'Problem deleted',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Problem deleted'
         }
       }
     }
   }
*/
  requireAuth,
  requireAdmin,
  problemController.deleteProblem
);

export default router;
