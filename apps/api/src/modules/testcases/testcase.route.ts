import { Router } from 'express';
import { testcaseController } from './testcase.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createTestcaseSchema } from './testcase.schema';

const router = Router({ mergeParams: true });

router.post(
  '/',
/* #swagger.tags = ['Testcases']
   #swagger.summary = 'Add testcase to problem (admin)'
   #swagger.description = 'Add input/output testcase for a problem. Admin only.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.parameters['problemId'] = { 
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
             input: { type: 'string' }, 
             output: { type: 'string' }, 
             weight: { type: 'number' } 
           }, 
           required: ['input', 'output'] 
         }, 
         example: { 
           input: '1 2\n', 
           output: '3\n', 
           weight: 1 
         } 
       } 
     } 
   }
   #swagger.responses[201] = { 
     description: 'Testcase added', 
     content: { 
       'application/json': { 
         example: { 
           status: 'Success', 
           message: 'Testcase added', 
           data: { 
             testcaseId: 'tc_1' 
           } 
         } 
       } 
     } 
   }
*/
  requireAuth,
  requireAdmin,
  validateRequest(createTestcaseSchema),
  testcaseController.addTestcase
);

router.get(
  '/',
/* #swagger.tags = ['Testcases']
   #swagger.summary = 'Get testcases for a problem'
   #swagger.description = 'Return public metadata about testcases (not secret answers) — admin may access full data.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.parameters['problemId'] = { 
     in: 'path', 
     required: true, 
     schema: { type: 'string' } 
   }
   #swagger.responses[200] = { 
     description: 'Testcases list', 
     content: { 
       'application/json': { 
         example: { 
           status: 'Success', 
           message: 'Testcases fetched', 
           data: [ 
             { 
               testcaseId: 'tc_1', 
               inputPreview: '1 2', 
               weight: 1 
             } 
           ] 
         } 
       } 
     } 
   }
*/
  requireAuth,
  testcaseController.getTestcases
);

router.delete(
  '/:testcaseId',
/* #swagger.tags = ['Testcases']
   #swagger.summary = 'Delete a testcase (admin)'
   #swagger.description = 'Delete a testcase by id. Admin only.'
   #swagger.security = [{ "bearerAuth": [] }]
   #swagger.parameters['testcaseId'] = { 
     in: 'path', 
     required: true, 
     schema: { type: 'string' } 
   }
   #swagger.responses[200] = { 
     description: 'Testcase deleted', 
     content: { 
       'application/json': { 
         example: { 
           status: 'Success', 
           message: 'Testcase deleted' 
         } 
       } 
     } 
   }
*/
  requireAuth,
  requireAdmin,
  testcaseController.deleteTestcase
);

export default router;
