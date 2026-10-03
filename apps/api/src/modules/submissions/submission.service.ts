import { ProgrammingLanguage } from '@prisma/client';
import { DEFAULT_LIMITS } from '@ocj/contracts';
import { executeTestCase, LANGUAGE_IDS, LanguageKey } from '@ocj/executor';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../config/prisma';
import { submissionQueue } from '../../config/queue';

const problemSelect = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
  time_limit: true,
};

const formatSubmission = (submission: any) => ({
  id: submission.id,
  _id: submission.id,
  userId: submission.user_id,
  problemId: submission.problem_id,
  code: submission.code,
  language: submission.language,
  status: submission.status,
  executionTime: submission.execution_time,
  memoryUsed: submission.memory_used,
  errorMessage: submission.error_message,
  testCasesPassed: submission.test_cases_passed,
  testCasesTotal: submission.test_cases_total,
  aiFeedback: submission.ai_feedback,
  matchId: submission.match_id,
  createdAt: submission.created_at,
  updatedAt: submission.updated_at,
  problem: submission.problem
    ? {
        id: submission.problem.id,
        title: submission.problem.title,
        slug: submission.problem.slug,
        difficulty: submission.problem.difficulty,
      }
    : undefined,
});

export class SubmissionService {
  private async findProblem(slugOrId: string) {
    return prisma.problem.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      select: problemSelect,
    });
  }

  async submit(
    userId: string,
    data: {
      problemId: string;
      code: string;
      language: 'cpp' | 'java' | 'python';
      matchId?: string;
    }
  ) {
    const problem = await this.findProblem(data.problemId);
    if (!problem) {
      throw new AppError('Problem not found', 404);
    }

    const submission = await prisma.submission.create({
      data: {
        user_id: userId,
        problem_id: problem.id,
        code: data.code,
        language: data.language as ProgrammingLanguage,
        status: 'PENDING',
        test_cases_passed: 0,
        test_cases_total: 0,
        match_id: data.matchId ?? null,
      },
    });

    await submissionQueue.add('submission-job', {
      submissionId: submission.id,
      code: submission.code,
      language: submission.language,
      problemId: problem.id,
    });

    return formatSubmission(submission);
  }

  async getSubmissionDetails(submissionId: string, userId: string, isAdmin = false) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: {
          select: problemSelect,
        },
      },
    });

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    if (submission.user_id !== userId && !isAdmin) {
      throw new AppError('Forbidden: Access denied to this submission', 403);
    }

    return formatSubmission(submission);
  }

  async getUserSubmissions(
    userId: string,
    filters: {
      problemId?: string;
      page: number;
      limit: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    let problemId = filters.problemId;
    if (problemId) {
      const problem = await this.findProblem(problemId);
      problemId = problem?.id ?? problemId;
    }

    const where = {
      user_id: userId,
      ...(problemId ? { problem_id: problemId } : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          problem: {
            select: problemSelect,
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      items: items.map(formatSubmission),
    };
  }

  async runCode(data: {
    problemId?: string;
    code: string;
    language: 'cpp' | 'java' | 'python';
    customInput?: string;
  }) {
    const judge0Url = process.env.JUDGE0_URL || 'http://localhost:2358';
    const languageId = LANGUAGE_IDS[data.language as LanguageKey] || 71;

    let testcasesToRun: Array<{ input: string; output: string; is_example: boolean }> = [];
    let problem: Awaited<ReturnType<SubmissionService['findProblem']>> = null;

    if (data.problemId) {
      problem = await this.findProblem(data.problemId);
      if (!problem) {
        throw new AppError('Problem not found', 404);
      }

      if (data.customInput !== undefined && data.customInput !== null) {
        testcasesToRun = [{ input: data.customInput, output: '', is_example: false }];
      } else {
        testcasesToRun = await prisma.testcase.findMany({
          where: { problem_id: problem.id, is_example: true },
          orderBy: { id: 'asc' },
        });
        if (testcasesToRun.length === 0) {
          testcasesToRun = [{ input: '', output: '', is_example: true }];
        }
      }
    } else {
      testcasesToRun = [
        { input: data.customInput ?? '', output: '', is_example: false },
      ];
    }

    const results = [];
    for (const tc of testcasesToRun) {
      const timeLimit = problem?.time_limit ?? DEFAULT_LIMITS.TIME_LIMIT_MS;
      let result;
      try {
        result = await executeTestCase(
          data.code,
          languageId,
          tc.input,
          tc.output,
          timeLimit,
          {
            judge0Url,
          }
        );
      } catch (error: any) {
        throw new AppError(
          `Judge0 sandbox unavailable: ${error?.message || 'Unknown execution error'}`,
          503
        );
      }
      let finalStatus = result.status;
      if (data.customInput !== undefined && !['CE', 'RE', 'TLE'].includes(finalStatus)) {
        finalStatus = 'ACCEPTED';
      }

      results.push({
        status: finalStatus,
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: result.actualOutput,
        time: result.time,
        memory: result.memory,
        error: result.error,
      });
    }

    return results;
  }
}

export const submissionService = new SubmissionService();
