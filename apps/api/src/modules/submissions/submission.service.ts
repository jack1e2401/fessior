import { ProgrammingLanguage } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { submissionQueue } from '../../config/queue';
import { submissionRepository } from './submission.repository';

export const formatSubmission = (submission: any) => ({
  id: submission.id,
  _id: submission.id,
  userId: submission.user_id,
  problemId: submission.problem_id,
  testcaseSetId: submission.testcase_set_id,
  code: submission.code,
  language: submission.language,
  status: submission.status,
  executionTime: submission.execution_time,
  memoryUsed: submission.memory_used,
  errorMessage: submission.error_message,
  testCasesPassed: submission.test_cases_passed,
  testCasesTotal: submission.test_cases_total,
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
  async submit(
    userId: string,
    data: {
      problemId: string;
      code: string;
      language: 'cpp' | 'java' | 'python';
      matchId?: string;
    }
  ) {
    const result = await submissionRepository.createPendingSubmissionForActiveSet({
      userId,
      slugOrId: data.problemId,
      code: data.code,
      language: data.language as ProgrammingLanguage,
      matchId: data.matchId ?? null,
    });
    if (result.kind === 'problem-not-found') {
      throw new AppError('Problem not found', 404);
    }
    if (result.kind === 'no-active-set') {
      throw new AppError('Problem has no active testcase set', 409);
    }
    const { submission } = result;

    await submissionQueue.add('submission-job', {
      submissionId: submission.id,
      code: submission.code,
      language: submission.language,
      problemId: submission.problem_id,
    });

    return formatSubmission(submission);
  }

  async getSubmissionDetails(submissionId: string, userId: string, isAdmin = false) {
    const submission = await submissionRepository.findByIdWithProblem(submissionId);

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
      const problem = await submissionRepository.findProblem(problemId);
      problemId = problem?.id ?? problemId;
    }

    const [total, items] = await submissionRepository.findUserSubmissions(
      userId,
      problemId,
      skip,
      limit
    );

    return {
      total,
      page,
      limit,
      items: items.map(formatSubmission),
    };
  }
}

export const submissionService = new SubmissionService();
