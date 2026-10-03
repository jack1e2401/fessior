import { Router } from 'express';
import { matchController } from './match.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';

const router = Router();

router.get(
	'/history',
/* #swagger.tags = ['Matches']
   #swagger.summary = 'Get match history for current user'
   #swagger.description = 'Return a paginated list of past matches for the authenticated user.'
   #swagger.security = [{ "bearerAuth": [] }]
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
   #swagger.responses[200] = {
     description: 'Match history',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Match history fetched',
           data: {
             items: [
               {
                 matchId: 'm1',
                 opponentId: 'user_2',
                 result: 'WIN',
                 score: 1200,
                 playedAt: '2026-06-12T11:00:00Z'
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
	requireAuth,
	matchController.getHistory
);

router.get(
	'/active',
/* #swagger.tags = ['Matches']
   #swagger.summary = 'Get active match for current user'
   #swagger.description = 'Returns the pending match the user is currently participating in.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.responses[200] = {
     description: 'Active match',
   }
*/
	requireAuth,
	matchController.getActiveMatch
);

router.get(
	'/:matchId',
/* #swagger.tags = ['Matches']
   #swagger.summary = 'Get details for a match'
   #swagger.description = 'Return detailed information for a specific match including moves, verdicts, and participants.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.parameters['matchId'] = {
     in: 'path',
     required: true,
     schema: { type: 'string' }
   }
   #swagger.responses[200] = {
     description: 'Match details',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Match details fetched',
           data: {
             matchId: 'm1',
             participants: [
               {
                 userId: 'user_1',
                 username: 'alice'
               },
               {
                 userId: 'user_2',
                 username: 'bob'
               }
             ],
             result: 'WIN',
             moves: [],
             playedAt: '2026-06-12T11:00:00Z'
           }
         }
       }
     }
   }
*/
	requireAuth,
	matchController.getMatchDetails
);

router.delete(
	'/:matchId',
/* #swagger.tags = ['Matches']
   #swagger.summary = 'Delete match (admin)'
   #swagger.description = 'Remove a match record. Admin only.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.parameters['matchId'] = {
     in: 'path',
     required: true,
     schema: { type: 'string' }
   }
   #swagger.responses[200] = {
     description: 'Match deleted',
     content: {
       'application/json': {
         example: {
           status: 'Success',
           message: 'Match deleted'
         }
       }
     }
   }
*/
	requireAuth,
	requireAdmin,
	matchController.deleteMatch
);

export default router;
