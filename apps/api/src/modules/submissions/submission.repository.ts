import { ProgrammingLanguage } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const problemSelect = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
  time_limit: true,
};

export class SubmissionRepository {
  async findProblem(slugOrId: string) {
    return prisma.problem.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      select: problemSelect,
    });
  }

  async createPendingSubmission(data: {
    userId: string;
    problemId: string;
    code: string;
    language: ProgrammingLanguage;
    matchId?: string | null;
  }) {
    return prisma.submission.create({
      data: {
        user_id: data.userId,
        problem_id: data.problemId,
        code: data.code,
        language: data.language,
        status: 'PENDING',
        test_cases_passed: 0,
        test_cases_total: 0,
        match_id: data.matchId ?? null,
      },
    });
  }

  async findByIdWithProblem(submissionId: string) {
    return prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: {
          select: problemSelect,
        },
      },
    });
  }

  async findUserSubmissions(
    userId: string,
    problemId: string | undefined,
    skip: number,
    take: number
  ) {
    const where = {
      user_id: userId,
      ...(problemId ? { problem_id: problemId } : {}),
    };

    return prisma.$transaction([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: {
          problem: {
            select: problemSelect,
          },
        },
      }),
    ]);
  }

  async findExampleTestcases(problemId: string) {
    return prisma.testcase.findMany({
      where: { problem_id: problemId, is_example: true },
      orderBy: { id: 'asc' },
    });
  }
}

export const submissionRepository = new SubmissionRepository();
