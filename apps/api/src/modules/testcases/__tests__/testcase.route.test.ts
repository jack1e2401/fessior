import express from 'express';
import request from 'supertest';

// Mock dependencies before importing routes/controllers
const executionOrder: string[] = [];

jest.mock('../../auth/auth.middleware', () => ({
  requireAuth: jest.fn((req, res, next) => {
    executionOrder.push('requireAuth');
    next();
  }),
  requireAdmin: jest.fn((req, res, next) => {
    executionOrder.push('requireAdmin');
    next();
  }),
  optionalAuth: jest.fn((req, res, next) => {
    executionOrder.push('optionalAuth');
    next();
  }),
}));

jest.mock('../../../middlewares/validate.middleware', () => ({
  validateRequest: jest.fn((schema) => (req: any, res: any, next: any) => {
    executionOrder.push('validateRequest');
    next();
  }),
}));

jest.mock('../testcase.controller', () => ({
  testcaseController: {
    addTestcase: jest.fn(),
    getTestcases: jest.fn(),
    deleteTestcase: jest.fn(),
  },
}));

import { testcaseController } from '../testcase.controller';

describe('Testcase Routes & Middleware Order', () => {
  let app: express.Express;

  beforeEach(() => {
    executionOrder.length = 0;
    jest.clearAllMocks();

    (testcaseController.addTestcase as jest.Mock).mockImplementation((req, res) => {
      executionOrder.push('testcaseController.addTestcase');
      res.status(201).json({ status: 'Success', message: 'Testcase added' });
    });

    (testcaseController.getTestcases as jest.Mock).mockImplementation((req, res) => {
      executionOrder.push('testcaseController.getTestcases');
      res.status(200).json({ status: 'Success', message: 'Testcases fetched' });
    });

    (testcaseController.deleteTestcase as jest.Mock).mockImplementation((req, res) => {
      executionOrder.push('testcaseController.deleteTestcase');
      res.status(200).json({ status: 'Success', message: 'Testcase deleted' });
    });

    app = express();
    app.use(express.json());

    // Dynamically resolve testcase routes (testcase.route if available, else problem.route)
    let testcaseRouter: any;
    try {
      testcaseRouter = require('../testcase.route').default;
      // When dedicated testcase.route is used
      app.use('/api/v1/problems/:problemId/testcases', testcaseRouter);
      app.use('/api/v1/problems/testcases', testcaseRouter);
    } catch {
      const problemRouter = require('../../problems/problem.route').default;
      app.use('/api/v1/problems', problemRouter);
    }
  });

  it('should enforce auth, admin, and validation before addTestcase', async () => {
    const res = await request(app)
      .post('/api/v1/problems/problem-123/testcases')
      .send({ input: '1 2\n', output: '3\n', weight: 1 });

    expect(res.status).toBe(201);
    expect(executionOrder).toEqual([
      'requireAuth',
      'requireAdmin',
      'validateRequest',
      'testcaseController.addTestcase',
    ]);
  });

  it('should enforce auth before getTestcases', async () => {
    const res = await request(app)
      .get('/api/v1/problems/problem-123/testcases');

    expect(res.status).toBe(200);
    expect(executionOrder).toEqual([
      'requireAuth',
      'testcaseController.getTestcases',
    ]);
  });

  it('should enforce auth and admin before deleteTestcase', async () => {
    const res = await request(app)
      .delete('/api/v1/problems/testcases/tc-999');

    expect(res.status).toBe(200);
    expect(executionOrder).toEqual([
      'requireAuth',
      'requireAdmin',
      'testcaseController.deleteTestcase',
    ]);
  });
});
