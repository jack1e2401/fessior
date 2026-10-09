import request from 'supertest';
import app from '../../../app';

describe('retired auth routes', () => {
  it('does not expose password change without recovery', async () => {
    const response = await request(app).post('/api/v1/auth/change-password').send({});
    expect(response.status).toBe(404);
  });

  it.each([
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
  ])('registers POST %s and validates its payload', async (path) => {
    const response = await request(app).post(path).send({});
    expect(response.status).toBe(400);
  });
});
