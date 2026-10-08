import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('registers, logs in, and reads the current account', async () => {
    // 1. Register
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'test_auth_user',
        email: 'auth_test@example.com',
        password: 'Password123!',
      });
    expect(regRes.status).toBe(201);
    expect(regRes.body.status).toBe('Success');

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'auth_test@example.com',
        password: 'Password123!',
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.status).toBe('Success');
    const token = loginRes.body.data.accessToken;

    // 3. Get Me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.status).toBe('Success');
    expect(meRes.body.data.username).toBe('test_auth_user');

  });
});
