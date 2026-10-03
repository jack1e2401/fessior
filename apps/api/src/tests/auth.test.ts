import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import bcrypt from 'bcrypt';

describe('Auth & Session Integration Tests', () => {
  beforeEach(async () => {
    await prisma.passwordResetToken.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should register, login, get me, change password, and reset password successfully', async () => {
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

    // 4. Change Password
    const changeRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        oldPassword: 'Password123!',
        newPassword: 'NewPassword123!',
      });
    expect(changeRes.status).toBe(200);
    expect(changeRes.body.status).toBe('Success');

    // 5. Get sessions
    // Note: since change-password revokes all sessions, we login again with new password
    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'auth_test@example.com',
        password: 'NewPassword123!',
      });
    expect(loginRes2.status).toBe(200);
    const token2 = loginRes2.body.data.accessToken;

    const sessionsRes = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${token2}`);
    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.status).toBe('Success');
    expect(sessionsRes.body.data.sessions.length).toBeGreaterThan(0);

    // 6. Forgot Password
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: 'auth_test@example.com',
      });
    expect(forgotRes.status).toBe(200);

    // Fetch the reset token from database
    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { used: false },
    });
    expect(resetTokenRecord).not.toBeNull();
    const resetToken = resetTokenRecord!.token;

    // 7. Reset Password
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'BrandNewPassword123!',
      });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.status).toBe('Success');
  });
});
