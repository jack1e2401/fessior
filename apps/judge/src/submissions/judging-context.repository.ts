import { prisma } from '../config/prisma';

export class JudgingContextRepository {
  findProblemById(id: string) {
    return prisma.problem.findUnique({
      where: { id },
    });
  }

  findTestcasesBySetId(testcaseSetId: string) {
    return prisma.testcase.findMany({
      where: { testcase_set_id: testcaseSetId },
      orderBy: { position: 'asc' },
    });
  }
}

export const judgingContextRepository = new JudgingContextRepository();
