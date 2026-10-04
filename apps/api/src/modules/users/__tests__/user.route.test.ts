import express from 'express';
import request from 'supertest';

jest.mock('../../auth/auth.middleware', () => ({
  requireAuth: (req: express.Request, res: express.Response, next: express.NextFunction) =>
    req.headers.authorization ? next() : res.status(401).json({ message: 'Unauthorized' }),
  requireAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));
jest.mock('../../../middlewares/validate.middleware', () => ({ validateRequest: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next() }));
jest.mock('../user.controller', () => ({
  getUserSubmissionsByUsername: (_req: express.Request, res: express.Response) => res.status(200).json({ route: 'public' }),
  getUserSubmissions: (_req: express.Request, res: express.Response) => res.status(200).json({ route: 'private' }),
}));

import userRouter from '../user.route';

it('requires authentication for /users/me/submissions before the public username route', async () => {
  const app = express();
  app.use('/users', userRouter);
  const response = await request(app).get('/users/me/submissions');
  expect(response.status).toBe(401);
  const authenticated = await request(app).get('/users/me/submissions').set('Authorization', 'Bearer test');
  expect(authenticated.status).toBe(200);
  expect(authenticated.body.route).toBe('private');
});

it('keeps submissions for another username public', async () => {
  const app = express();
  app.use('/users', userRouter);
  const response = await request(app).get('/users/alice/submissions');
  expect(response.status).toBe(200);
  expect(response.body.route).toBe('public');
});
