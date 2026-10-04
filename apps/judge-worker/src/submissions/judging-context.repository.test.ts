import assert from 'node:assert/strict';
import { test } from 'node:test';
import '../config/env';
import { prisma } from '../config/prisma';
import { judgingContextRepository } from './judging-context.repository';

test('worker loads only the submission-pinned testcase set', async () => {
  const problem = await prisma.problem.create({
    data: {
      title: 'Worker pinning test', slug: `worker-pinning-${Date.now()}`,
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

    const pinnedCases = await judgingContextRepository.findTestcasesBySetId(first.id);
    assert.deepEqual(pinnedCases.map((item) => item.input), ['old']);
    const activeCases = await judgingContextRepository.findTestcasesBySetId(second.id);
    assert.deepEqual(activeCases.map((item) => item.input), ['new']);
  } finally {
    await prisma.problem.update({ where: { id: problem.id }, data: { active_testcase_set_id: null } });
    await prisma.problem.delete({ where: { id: problem.id } });
    await prisma.$disconnect();
  }
});
