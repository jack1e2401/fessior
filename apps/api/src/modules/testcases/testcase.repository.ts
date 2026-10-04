import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import type { ImportedCase } from './ingestion/archive-parser';

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
  async importSet(problemId: string, checksum: string, cases: ImportedCase[]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const problem = await tx.problem.findUnique({ where: { id: problemId }, select: { active_testcase_set_id: true } });
          if (!problem) throw new AppError('Problem not found', 404);
          if (problem.active_testcase_set_id) {
            const active = await tx.testcaseSet.findUnique({
              where: { id: problem.active_testcase_set_id }, select: { problem_id: true },
            });
            if (active?.problem_id !== problemId) throw new AppError('Active testcase set belongs to another problem', 409);
          }
          const latest = await tx.testcaseSet.findFirst({
            where: { problem_id: problemId }, orderBy: { version: 'desc' }, select: { version: true },
          });
          const set = await tx.testcaseSet.create({
            data: {
              problem_id: problemId,
              version: (latest?.version ?? 0) + 1,
              checksum,
              testcases: { create: cases.map((item) => ({
                position: item.position, is_example: item.isExample, input: item.input, output: item.output,
              })) },
            },
          });
          const switched = await tx.problem.updateMany({
            where: { id: problemId, active_testcase_set_id: problem.active_testcase_set_id },
            data: { active_testcase_set_id: set.id },
          });
          if (switched.count !== 1) throw new AppError('Active testcase set changed during import', 409);
          return {
            testcaseSetId: set.id, version: set.version, checksum,
            testcaseCount: cases.length, exampleCount: cases.filter((item) => item.isExample).length, active: true,
          };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
        if (code === 'P2034' || code === 'P2002' || (error instanceof AppError && error.statusCode === 409)) {
          if (attempt < 2) continue;
          throw new AppError('Concurrent testcase import conflict; retry request', 409);
        }
        throw error;
      }
    }
    throw new AppError('Concurrent testcase import conflict; retry request', 409);
  }
  async activateTestcaseSet(problemId: string, setId: string) {
    return prisma.$transaction(async (tx) => {
      const problem = await tx.problem.findUnique({
        where: { id: problemId }, select: { active_testcase_set_id: true },
      });
      if (!problem) return null;
      const set = await tx.testcaseSet.findUnique({ where: { id: setId } });
      if (!set) return null;
      if (set.problem_id !== problemId) throw new Error('Testcase set belongs to another problem');
      const switched = await tx.problem.updateMany({
        where: { id: problemId, active_testcase_set_id: problem.active_testcase_set_id },
        data: { active_testcase_set_id: setId },
      });
      if (switched.count !== 1) throw new Error('Active testcase set changed during update');
      return set;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async addTestcase(problemId: string, data: CaseInput) {
    return prisma.$transaction(async (tx) => {
      const problem = await tx.problem.findUnique({
        where: { id: problemId },
        include: { activeTestcaseSet: { include: { testcases: { orderBy: { position: 'asc' } } } } },
      });
      if (!problem) return null;

      const active = problem.activeTestcaseSet;
      if (active && active.problem_id !== problemId) throw new Error('Active testcase set belongs to another problem');
      const latest = await tx.testcaseSet.findFirst({
        where: { problem_id: problemId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const next = await tx.testcaseSet.create({
        data: {
          problem_id: problemId,
          version: (latest?.version ?? 0) + 1,
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

      const latest = await tx.testcaseSet.findFirst({
        where: { problem_id: problemId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const current = await tx.testcase.findMany({
        where: { testcase_set_id: testcase.testcase_set_id },
        orderBy: { position: 'asc' },
      });
      const next = await tx.testcaseSet.create({
        data: {
          problem_id: problemId,
          version: (latest?.version ?? 0) + 1,
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
