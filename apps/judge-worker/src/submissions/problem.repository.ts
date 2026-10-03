import { prisma } from '../config/prisma';

export class ProblemRepository {
  findById(id: string) {
    return prisma.problem.findUnique({
      where: { id },
    });
  }
}

export const problemRepository = new ProblemRepository();
