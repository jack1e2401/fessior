import { Queue } from 'bullmq';
import { prisma } from '../config/prisma';
import { redisOptions } from '../config/redis';
import { SUBMISSION_QUEUE_OPTIONS } from '../modules/submissions/submission.constants';
import { submissionRepository } from '../modules/submissions/submission.repository';

describe('durable PENDING reconciliation and BullMQ identity', () => {
  const suffix = Date.now().toString(36);
  let problemId: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { username: `reconcile_${suffix}`, email: `reconcile_${suffix}@example.com` } });
    userId = user.id;
    const problem = await prisma.problem.create({ data: {
      title: 'Reconciliation test', slug: `reconcile-${suffix}`, description: 'test', difficulty: 'EASY',
      starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
    } });
    problemId = problem.id;
  });

  afterAll(async () => {
    if (problemId) {
      await prisma.submission.deleteMany({ where: { problem_id: problemId } });
      await prisma.problem.delete({ where: { id: problemId } });
    }
    if (userId) await prisma.user.delete({ where: { id: userId } });
  });

  it('selects only stale PENDING rows in a bounded batch and guards SYSTEM_ERROR', async () => {
    const set = await prisma.testcaseSet.create({ data: { problem_id: problemId, version: 1,
      testcases: { create: [{ position: 0, input: '1', output: '1' }] },
    } });
    const old = await prisma.submission.create({ data: {
      user_id: userId, problem_id: problemId, testcase_set_id: set.id, code: 'print(1)', language: 'python',
      created_at: new Date('2020-01-01T00:00:00Z'),
    } });
    const recent = await prisma.submission.create({ data: {
      user_id: userId, problem_id: problemId, testcase_set_id: set.id, code: 'print(2)', language: 'python',
    } });
    expect((await submissionRepository.findStalePending(new Date('2021-01-01T00:00:00Z'), 1)).map((item) => item.id)).toEqual([old.id]);
    expect(await submissionRepository.markPendingSystemError(old.id, 'Judging failed after retry attempts')).toBe(true);
    expect(await submissionRepository.markPendingSystemError(old.id, 'overwrite')).toBe(false);
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: old.id } })).error_message)
      .toBe('Judging failed after retry attempts');
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: recent.id } })).status).toBe('PENDING');
  });

  it('BullMQ deduplicates the same deterministic jobId', async () => {
    const queue = new Queue(`phase4_identity_${suffix}`, { connection: redisOptions, defaultJobOptions: SUBMISSION_QUEUE_OPTIONS });
    try {
      const first = await queue.add('submission-job', { submissionId: 'same-submission' }, { jobId: 'same-submission' });
      const second = await queue.add('submission-job', { submissionId: 'same-submission' }, { jobId: 'same-submission' });
      expect(first.id).toBe('same-submission');
      expect(second.id).toBe(first.id);
      expect((await queue.getJobs(['waiting', 'active', 'delayed'])).map((job) => job.id)).toEqual(['same-submission']);
    } finally {
      await queue.obliterate({ force: true });
      await queue.close();
    }
  });
});
