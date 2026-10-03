import { prisma } from '../config/prisma';

export class JudgingContextRepository {
  findProblemById(id: string) {
    return prisma.problem.findUnique({
      where: { id },
    });
  }

  findTestcasesByProblemId(problemId: string) {
    return prisma.testcase.findMany({
      where: { problem_id: problemId },
      orderBy: { id: 'asc' },
    });
  }
}

export const judgingContextRepository = new JudgingContextRepository();
