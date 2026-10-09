import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import type { ImportedCase } from './ingestion/archive-parser';

type CaseInput = { isExample: boolean; input: string; output: string };
type TestcaseTransaction = Prisma.TransactionClient;

async function nextTestcaseVersion(tx: TestcaseTransaction, problemId: string) {
  const latest = await tx.testcaseSet.findFirst({
    where: { problem_id: problemId }, orderBy: { version: 'desc' }, select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}

async function activateNewSet(tx: TestcaseTransaction, problemId: string, previousId: string | null, nextId: string) {
  // CAS prevents a concurrent edit from silently replacing a newer active version.
  const switched = await tx.problem.updateMany({
    where: { id: problemId, active_testcase_set_id: previousId },
    data: { active_testcase_set_id: nextId },
  });
  return switched.count === 1;
}

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
  async listSetSummaries(problemId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [total, problem, sets] = await Promise.all([
      prisma.testcaseSet.count({ where: { problem_id: problemId } }),
      prisma.problem.findUnique({ where: { id: problemId }, select: { active_testcase_set_id: true } }),
      prisma.testcaseSet.findMany({
        where: { problem_id: problemId },
        orderBy: [{ version: 'desc' }, { id: 'asc' }],
        skip,
        take: limit,
        select: { id: true, version: true, checksum: true, created_at: true },
      }),
    ]);

    const setIds = sets.map((set) => set.id);
    const caseCounts = setIds.length
      ? await prisma.testcase.groupBy({
          by: ['testcase_set_id', 'is_example'],
          where: { testcase_set_id: { in: setIds } },
          _count: { _all: true },
        })
      : [];
    const countsBySet = new Map<string, { testcaseCount: number; exampleCount: number }>();
    for (const row of caseCounts) {
      const counts = countsBySet.get(row.testcase_set_id) ?? { testcaseCount: 0, exampleCount: 0 };
      counts.testcaseCount += row._count._all;
      if (row.is_example) counts.exampleCount += row._count._all;
      countsBySet.set(row.testcase_set_id, counts);
    }

    return {
      total,
      items: sets.map((set) => ({
        id: set.id,
        version: set.version,
        checksum: set.checksum,
        createdAt: set.created_at,
        active: set.id === problem?.active_testcase_set_id,
        ...(countsBySet.get(set.id) ?? { testcaseCount: 0, exampleCount: 0 }),
      })),
    };
  }

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
          const set = await tx.testcaseSet.create({
            data: {
              problem_id: problemId,
              version: await nextTestcaseVersion(tx, problemId),
              checksum,
              testcases: { create: cases.map((item) => ({
                position: item.position, is_example: item.isExample, input: item.input, output: item.output,
              })) },
            },
          });
          if (!await activateNewSet(tx, problemId, problem.active_testcase_set_id, set.id))
            throw new AppError('Active testcase set changed during import', 409);
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
      if (set.problem_id !== problemId) return null;
      if (!await activateNewSet(tx, problemId, problem.active_testcase_set_id, setId))
        throw new AppError('Active testcase set changed during update', 409);
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
      const next = await tx.testcaseSet.create({
        data: {
          problem_id: problemId,
          version: await nextTestcaseVersion(tx, problemId),
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
      if (!await activateNewSet(tx, problemId, active?.id ?? null, next.id))
        throw new Error('Active testcase set changed during update');
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
          version: await nextTestcaseVersion(tx, problemId),
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
      if (!await activateNewSet(tx, problemId, testcase.testcase_set_id, next.id))
        throw new Error('Active testcase set changed during update');
      return formatTestcase(testcase, problemId);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}

export const testcaseRepository = new TestcaseRepository();
