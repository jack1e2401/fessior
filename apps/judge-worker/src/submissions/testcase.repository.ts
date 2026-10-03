import { prisma } from '../config/prisma';

export class TestcaseRepository {
  findByProblemId(problemId: string) {
    return prisma.testcase.findMany({
      where: { problem_id: problemId },
      orderBy: { id: 'asc' },
    });
  }
}

export const testcaseRepository = new TestcaseRepository();
