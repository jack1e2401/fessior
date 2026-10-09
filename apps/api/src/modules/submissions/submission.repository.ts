import { MatchStatus, ProgrammingLanguage } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const problemSelect = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
  time_limit: true,
  memory_limit: true,
  active_testcase_set_id: true,
};

export class SubmissionRepository {
  findStalePending(cutoff: Date, take: number) {
    return prisma.submission.findMany({
      where: { status: 'PENDING', created_at: { lte: cutoff } },
      orderBy: { created_at: 'asc' }, take, select: { id: true },
    });
  }

  async markPendingSystemError(id: string, message: string) {
    const updated = await prisma.submission.updateMany({
      where: { id, status: 'PENDING' }, data: { status: 'SYSTEM_ERROR', error_message: message },
    });
    return updated.count === 1;
  }
  async findProblem(slugOrId: string) {
    return prisma.problem.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      select: problemSelect,
    });
  }

  async createPendingSubmissionForActiveSet(data: {
    userId: string;
    slugOrId: string;
    code: string;
    language: ProgrammingLanguage;
    matchId?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const problem = await tx.problem.findFirst({
        where: { OR: [{ id: data.slugOrId }, { slug: data.slugOrId }] },
        select: { id: true, active_testcase_set_id: true },
      });
      if (!problem) return { kind: 'problem-not-found' as const };
      if (!problem.active_testcase_set_id) return { kind: 'no-active-set' as const };

      if (data.matchId) {
        await tx.$queryRaw`SELECT id FROM matches WHERE id = ${data.matchId} FOR UPDATE`;
        const match = await tx.match.findUnique({
          where: { id: data.matchId },
          select: { problem_id: true, status: true, participants: { where: { user_id: data.userId }, select: { id: true } } },
        });
        if (!match || match.status !== MatchStatus.RUNNING || match.problem_id !== problem.id || match.participants.length !== 1) {
          return { kind: 'invalid-match' as const };
        }
      }

      const submission = await tx.submission.create({
        data: {
          user_id: data.userId,
          problem_id: problem.id,
          testcase_set_id: problem.active_testcase_set_id,
          code: data.code,
          language: data.language,
          status: 'PENDING',
          test_cases_passed: 0,
          test_cases_total: 0,
          match_id: data.matchId ?? null,
          status_events: { create: { sequence: 1, status: 'PENDING' } },
        },
      });
      return { kind: 'created' as const, submission };
    });
  }

  async findByIdWithProblem(submissionId: string) {
    return prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        status_events: { orderBy: { sequence: 'asc' }, select: { status: true, created_at: true } },
        case_results: { orderBy: { position: 'asc' }, select: { position: true, status: true, execution_time: true, memory_used: true } },
        testcaseSet: { select: { version: true } },
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

  async findExampleTestcases(testcaseSetId: string) {
    return prisma.testcase.findMany({
      where: { testcase_set_id: testcaseSetId, is_example: true },
      orderBy: { position: 'asc' },
    });
  }

  async findExampleTestcasesByIds(testcaseSetId: string, ids: string[]) {
    const testcases = await prisma.testcase.findMany({
      where: { testcase_set_id: testcaseSetId, is_example: true, id: { in: ids } },
      orderBy: { position: 'asc' },
    });
    return testcases;
  }
}

export const submissionRepository = new SubmissionRepository();
