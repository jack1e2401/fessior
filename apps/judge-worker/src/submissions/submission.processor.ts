import { SUPPORTED_LANGUAGES } from '@ocj/contracts';
import { LanguageKey } from '@ocj/executor';
import { SubmissionPublisher, submissionPublisher } from './submission.publisher';
import { ProblemRepository, problemRepository } from './problem.repository';
import { SubmissionRepository, submissionRepository } from './submission.repository';
import { TestcaseRepository, testcaseRepository } from './testcase.repository';
import { SubmissionJudgeService, submissionJudgeService } from '../sandbox/submission-judge.service';
import { env } from '../config/env';

export interface SubmissionJobData {
  submissionId: string;
  code: string;
  language: string;
  problemId: string;
}

interface SubmissionProcessorDependencies {
  submissionRepository: SubmissionRepository;
  problemRepository: ProblemRepository;
  testcaseRepository: TestcaseRepository;
  judgeService: SubmissionJudgeService;
  publisher: SubmissionPublisher;
  getJudge0Url: () => string;
}

const isSubmissionJobData = (value: unknown): value is SubmissionJobData => {
  if (!value || typeof value !== 'object') return false;

  const data = value as Record<string, unknown>;
  return (
    typeof data.submissionId === 'string' &&
    typeof data.code === 'string' &&
    typeof data.language === 'string' &&
    typeof data.problemId === 'string'
  );
};

const isLanguageKey = (value: string): value is LanguageKey => {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
};

export class SubmissionProcessor {
  constructor(private readonly dependencies: SubmissionProcessorDependencies) {}

  async process(rawData: unknown) {
    if (!isSubmissionJobData(rawData)) {
      throw new Error('Invalid submission job data');
    }

    if (!isLanguageKey(rawData.language)) {
      throw new Error(`Unsupported submission language: ${rawData.language}`);
    }

    const { submissionId, code, language, problemId } = rawData;

    const submission = await this.dependencies.submissionRepository.findById(submissionId);
    if (!submission) {
      console.error(`Submission ${submissionId} not found in database`);
      return;
    }

    await this.dependencies.submissionRepository.markProcessing(submissionId);

    const problem = await this.dependencies.problemRepository.findById(problemId);
    if (!problem) {
      await this.dependencies.submissionRepository.markSystemError(submissionId, 'Problem context not found');
      return;
    }

    const testCases = await this.dependencies.testcaseRepository.findByProblemId(problemId);
    if (testCases.length === 0) {
      await this.dependencies.submissionRepository.markSystemError(submissionId, 'No testcases found for this problem');
      return;
    }

    const judgeResult = await this.dependencies.judgeService.judge({
      code,
      language,
      problem,
      testCases,
      judge0Url: this.dependencies.getJudge0Url(),
    });

    await this.dependencies.submissionRepository.finalize(submissionId, {
      status: judgeResult.status,
      testCasesPassed: judgeResult.passedCount,
      testCasesTotal: judgeResult.totalCount,
      executionTime: judgeResult.executionTime,
      memoryUsed: judgeResult.memoryUsed,
      errorMessage: judgeResult.errorMessage,
    });
    console.log(
      `Submission ${submissionId} evaluated: ${judgeResult.status} (${judgeResult.passedCount}/${judgeResult.totalCount})`
    );

    await this.dependencies.publisher.publishFinalResult({
      submissionId,
      userId: submission.user_id,
      problemId,
      status: judgeResult.status,
      testCasesPassed: judgeResult.passedCount,
      testCasesTotal: judgeResult.totalCount,
      matchId: submission.match_id ?? undefined,
    });
  }

  async handleFinalFailure(rawData: unknown, error: Error) {
    if (!isSubmissionJobData(rawData)) {
      return;
    }

    const submission = await this.dependencies.submissionRepository.findById(rawData.submissionId);
    if (!submission) {
      return;
    }

    const message = error.message || 'Submission worker failed after all retry attempts';
    await this.dependencies.submissionRepository.markSystemError(rawData.submissionId, message);

    await this.dependencies.publisher.publishFinalResult({
      submissionId: rawData.submissionId,
      userId: submission.user_id,
      problemId: rawData.problemId,
      status: 'SYSTEM_ERROR',
      testCasesPassed: submission.test_cases_passed,
      testCasesTotal: submission.test_cases_total,
      matchId: submission.match_id ?? undefined,
    });
  }
}

export const createSubmissionProcessor = () => {
  return new SubmissionProcessor({
    submissionRepository,
    problemRepository,
    testcaseRepository,
    judgeService: submissionJudgeService,
    publisher: submissionPublisher,
    getJudge0Url: () => env.JUDGE0_URL,
  });
};
