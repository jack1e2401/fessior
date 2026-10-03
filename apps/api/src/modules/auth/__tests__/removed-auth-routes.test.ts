import request from 'supertest';
import app from '../../../app';

describe('retired password recovery and change routes', () => {
  it.each([
    '/api/v1/auth/change-password',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
  ])('does not expose POST %s', async (path) => {
    const response = await request(app).post(path).send({});
    expect(response.status).toBe(404);
  });
});
