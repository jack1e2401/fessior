import assert from 'node:assert/strict';
import { test } from 'node:test';
import '../config/env';
import { prisma } from '../config/prisma';
import { submissionRepository } from './submission.repository';

test('guarded transitions claim once and never overwrite a terminal verdict', async () => {
  const suffix = Date.now().toString(36);
  const user = await prisma.user.create({ data: { username: `guard_${suffix}`, email: `guard_${suffix}@example.com` } });
  const problem = await prisma.problem.create({ data: {
    title: 'Guarded submission', slug: `guard-${suffix}`, description: 'test', difficulty: 'EASY',
    starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
  } });
  try {
    const set = await prisma.testcaseSet.create({ data: { problem_id: problem.id, version: 1,
      testcases: { create: [{ position: 0, input: '1', output: '1' }] },
    } });
    const submission = await prisma.submission.create({ data: {
      user_id: user.id, problem_id: problem.id, testcase_set_id: set.id, code: 'print(1)', language: 'python',
    } });
    assert.equal(await submissionRepository.claimPending(submission.id), true);
    assert.equal(await submissionRepository.claimPending(submission.id), false);
    const result = { status: 'ACCEPTED' as const, testCasesPassed: 1, testCasesTotal: 1,
      executionTime: 12, memoryUsed: 1024, errorMessage: null };
    assert.equal(await submissionRepository.finalize(submission.id, result), true);
    assert.equal(await submissionRepository.finalize(submission.id, { ...result, status: 'WA' }), false);
    assert.equal(await submissionRepository.markSystemError(submission.id, 'later failure'), false);
    const stored = await prisma.submission.findUniqueOrThrow({ where: { id: submission.id } });
    assert.equal(stored.status, 'ACCEPTED');
    assert.equal(stored.error_message, null);

    const failed = await prisma.submission.create({ data: {
      user_id: user.id, problem_id: problem.id, testcase_set_id: set.id, code: 'print(2)', language: 'python',
    } });
    assert.equal(await submissionRepository.claimPending(failed.id), true);
    assert.equal(await submissionRepository.markSystemError(failed.id, 'Judging failed after retry attempts'), true);
    assert.equal((await prisma.submission.findUniqueOrThrow({ where: { id: failed.id } })).status, 'SYSTEM_ERROR');
  } finally {
    await prisma.submission.deleteMany({ where: { problem_id: problem.id } });
    await prisma.problem.delete({ where: { id: problem.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
