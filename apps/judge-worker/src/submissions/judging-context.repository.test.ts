import assert from 'node:assert/strict';
import { test } from 'node:test';
import '../config/env';
import { prisma } from '../config/prisma';
import { judgingContextRepository } from './judging-context.repository';
import { submissionRepository } from './submission.repository';

test('worker loads only the submission-pinned testcase set', async () => {
  const suffix = Date.now();
  const user = await prisma.user.create({
    data: { username: `worker_pin_${suffix}`, email: `worker_pin_${suffix}@example.com` },
  });
  const problem = await prisma.problem.create({
    data: {
      title: 'Worker pinning test', slug: `worker-pinning-${suffix}`,
      description: 'test', difficulty: 'EASY',
      starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
    },
  });

  try {
    const first = await prisma.testcaseSet.create({
      data: {
        problem_id: problem.id, version: 1,
        testcases: { create: [{ position: 0, input: 'old', output: 'old' }] },
      },
    });
    const second = await prisma.testcaseSet.create({
      data: {
        problem_id: problem.id, version: 2,
        testcases: { create: [{ position: 0, input: 'new', output: 'new' }] },
      },
    });
    await prisma.problem.update({ where: { id: problem.id }, data: { active_testcase_set_id: second.id } });

    const submission = await prisma.submission.create({
      data: {
        user_id: user.id, problem_id: problem.id, testcase_set_id: first.id,
        code: 'print(1)', language: 'python',
      },
    });
    const pinnedSubmission = await submissionRepository.findById(submission.id);
    assert.equal(pinnedSubmission?.testcase_set_id, first.id);

    const pinnedCases = await judgingContextRepository.findTestcasesBySetId(pinnedSubmission.testcase_set_id);
    assert.deepEqual(pinnedCases.map((item) => item.input), ['old']);
    const activeCases = await judgingContextRepository.findTestcasesBySetId(second.id);
    assert.deepEqual(activeCases.map((item) => item.input), ['new']);
  } finally {
    await prisma.submission.deleteMany({ where: { problem_id: problem.id } });
    await prisma.problem.update({ where: { id: problem.id }, data: { active_testcase_set_id: null } });
    await prisma.problem.delete({ where: { id: problem.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
