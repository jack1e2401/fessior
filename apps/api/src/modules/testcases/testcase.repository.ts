import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

type CaseInput = { isExample: boolean; input: string; output: string };

const formatTestcase = (testcase: {
  id: string;
  is_example: boolean;
  input: string;
  output: string;
}, problemId: string) => ({
  id: testcase.id,
  _id: testcase.id,
  problemId,
  isExample: testcase.is_example,
  input: testcase.input,
  output: testcase.output,
});

export class TestcaseRepository {
  async addTestcase(problemId: string, data: CaseInput) {
    return prisma.$transaction(async (tx) => {
      const problem = await tx.problem.findUnique({
        where: { id: problemId },
        include: { activeTestcaseSet: { include: { testcases: { orderBy: { position: 'asc' } } } } },
      });
      if (!problem) return null;

      const active = problem.activeTestcaseSet;
      const next = await tx.testcaseSet.create({
        data: {
          problem_id: problemId,
          version: (active?.version ?? 0) + 1,
          testcases: {
            create: [
              ...(active?.testcases ?? []).map((testcase, position) => ({
                position,
                is_example: testcase.is_example,
                input: testcase.input,
                output: testcase.output,
              })),
              { position: active?.testcases.length ?? 0, is_example: data.isExample, input: data.input, output: data.output },
            ],
          },
        },
        include: { testcases: { orderBy: { position: 'asc' } } },
      });
      const switched = await tx.problem.updateMany({
        where: { id: problemId, active_testcase_set_id: active?.id ?? null },
        data: { active_testcase_set_id: next.id },
      });
      if (switched.count !== 1) throw new Error('Active testcase set changed during update');
      return formatTestcase(next.testcases[next.testcases.length - 1], problemId);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async getTestcases(problemId: string, isExampleOnly = false) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { active_testcase_set_id: true },
    });
    if (!problem?.active_testcase_set_id) return [];
    const testcases = await prisma.testcase.findMany({
      where: {
        testcase_set_id: problem.active_testcase_set_id,
        ...(isExampleOnly ? { is_example: true } : {}),
      },
      orderBy: { position: 'asc' },
    });
    return testcases.map((testcase) => formatTestcase(testcase, problemId));
  }

  async deleteTestcase(problemId: string, testcaseId: string) {
    return prisma.$transaction(async (tx) => {
      const testcase = await tx.testcase.findUnique({
        where: { id: testcaseId },
        include: { testcaseSet: true },
      });
      if (!testcase) return null;
      if (testcase.testcaseSet.problem_id !== problemId) return null;
      const problem = await tx.problem.findUnique({
        where: { id: problemId },
        select: { active_testcase_set_id: true },
      });
      if (problem?.active_testcase_set_id !== testcase.testcase_set_id) return null;

      const current = await tx.testcase.findMany({
        where: { testcase_set_id: testcase.testcase_set_id },
        orderBy: { position: 'asc' },
      });
      const next = await tx.testcaseSet.create({
        data: {
          problem_id: problemId,
          version: testcase.testcaseSet.version + 1,
          testcases: {
            create: current.filter((item) => item.id !== testcaseId).map((item, position) => ({
              position,
              is_example: item.is_example,
              input: item.input,
              output: item.output,
            })),
          },
        },
      });
      const switched = await tx.problem.updateMany({
        where: { id: problemId, active_testcase_set_id: testcase.testcase_set_id },
        data: { active_testcase_set_id: next.id },
      });
      if (switched.count !== 1) throw new Error('Active testcase set changed during update');
      return formatTestcase(testcase, problemId);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}

export const testcaseRepository = new TestcaseRepository();
