import request from 'supertest';
import { prisma } from '../config/prisma';
import app from '../app';
import { generateAccessToken } from '../modules/auth/jwt';
import { testcaseRepository } from '../modules/testcases/testcase.repository';

describe('admin interview endpoints', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userIds: string[] = [];
  let problemId: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const [admin, user] = await Promise.all([
      prisma.user.create({ data: { username: `admin_${suffix}`, email: `admin_${suffix}@example.com`, role: 'ADMIN' } }),
      prisma.user.create({ data: { username: `user_${suffix}`, email: `user_${suffix}@example.com`, role: 'USER' } }),
    ]);
    userIds.push(admin.id, user.id);
    adminToken = generateAccessToken({ userId: admin.id, role: 'ADMIN' });
    userToken = generateAccessToken({ userId: user.id, role: 'USER' });
    const problem = await prisma.problem.create({
      data: {
        title: 'Admin testcase versions', slug: `admin-testcases-${suffix}`, description: 'Test problem',
        difficulty: 'EASY', starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
      },
    });
    problemId = problem.id;
    await testcaseRepository.addTestcase(problemId, { isExample: true, input: '1', output: '1' });
    await testcaseRepository.addTestcase(problemId, { isExample: false, input: '2', output: '2' });
  });

  afterAll(async () => {
    if (problemId) {
      await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: null } });
      await prisma.problem.delete({ where: { id: problemId } });
    }
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it('lets only admins read testcase-set metadata without testcase payloads', async () => {
    const forbidden = await request(app)
      .get(`/api/v1/problems/${problemId}/testcase-sets`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);

    const response = await request(app)
      .get(`/api/v1/problems/${problemId}/testcase-sets?page=1&limit=20`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items[0]).toMatchObject({ version: 2, testcaseCount: 2, exampleCount: 1, active: true });
    expect(response.body.data.items[1]).toMatchObject({ version: 1, testcaseCount: 1, exampleCount: 1, active: false });
    expect(response.body.data.items[0]).not.toHaveProperty('testcases');
    expect(response.body.data.items[0]).not.toHaveProperty('input');
  });

  it('lets admins page global submission summaries without source code', async () => {
    const activeSet = await prisma.testcaseSet.findFirstOrThrow({ where: { problem_id: problemId }, orderBy: { version: 'desc' } });
    const olderAt = new Date('2026-01-01T00:00:00.000Z');
    const newerAt = new Date('2026-01-02T00:00:00.000Z');
    await prisma.submission.createMany({ data: [
      { user_id: userIds[1], problem_id: problemId, testcase_set_id: activeSet.id, code: 'source code from user', language: 'python', status: 'ACCEPTED', test_cases_passed: 2, test_cases_total: 2, created_at: olderAt },
      { user_id: userIds[0], problem_id: problemId, testcase_set_id: activeSet.id, code: 'source code from admin', language: 'cpp', status: 'PROCESSING', test_cases_passed: 0, test_cases_total: 2, created_at: newerAt },
    ] });

    const forbidden = await request(app)
      .get('/api/v1/submissions/admin')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);

    const firstPage = await request(app)
      .get(`/api/v1/submissions/admin?page=1&limit=1&problemId=${problemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data).toMatchObject({ total: 2, page: 1, limit: 1 });
    expect(firstPage.body.data.items).toHaveLength(1);
    expect(firstPage.body.data.items[0]).toMatchObject({
      status: 'PROCESSING', language: 'cpp', testcaseSetVersion: activeSet.version,
      problem: { id: problemId }, user: { id: userIds[0] },
    });
    expect(firstPage.body.data.items[0]).not.toHaveProperty('code');

    const secondPage = await request(app)
      .get(`/api/v1/submissions/admin?page=2&limit=1&problemId=${problemId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(secondPage.body.data.items[0]).toMatchObject({ status: 'ACCEPTED', user: { id: userIds[1] } });

    const filtered = await request(app)
      .get(`/api/v1/submissions/admin?page=1&limit=1&status=PROCESSING&problemId=${problemId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(filtered.body.data).toMatchObject({ total: 1, items: [{ status: 'PROCESSING' }] });
  });
});
