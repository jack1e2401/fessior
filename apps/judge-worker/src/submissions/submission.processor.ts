import { SUPPORTED_LANGUAGES } from '@ocj/contracts';
import { LanguageKey } from '@ocj/executor';
import { SubmissionPublisher, submissionPublisher } from './submission.publisher';
import { JudgingContextRepository, judgingContextRepository } from './judging-context.repository';
import { SubmissionRepository, submissionRepository } from './submission.repository';
import { SubmissionJudgeService, submissionJudgeService } from '../sandbox/submission-judge.service';
import { env } from '../config/env';

export interface SubmissionJobData {
  submissionId: string;
}

interface SubmissionProcessorDependencies {
  submissionRepository: SubmissionRepository;
  judgingContextRepository: JudgingContextRepository;
  judgeService: SubmissionJudgeService;
  publisher: SubmissionPublisher;
  getJudge0Url: () => string;
}

const isSubmissionJobData = (value: unknown): value is SubmissionJobData => {
  if (!value || typeof value !== 'object') return false;

  const data = value as Record<string, unknown>;
  return typeof data.submissionId === 'string' && data.submissionId.length > 0;
};

const isLanguageKey = (value: string): value is LanguageKey => {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
};

export class SubmissionProcessor {
  constructor(private readonly dependencies: SubmissionProcessorDependencies) {}

  private async loadJudgingContext(submission: NonNullable<Awaited<ReturnType<SubmissionRepository['findById']>>>) {
    const problem = await this.dependencies.judgingContextRepository.findProblemById(submission.problem_id);
    if (!problem) {
      await this.persistSystemError(submission, 'Problem context not found');
      return null;
    }
    const testCases = await this.dependencies.judgingContextRepository.findTestcasesBySetId(submission.testcase_set_id);
    if (testCases.length === 0) {
      await this.persistSystemError(submission, 'Pinned testcase set is empty');
      return null;
    }
    return { problem, testCases };
  }

  private async persistVerdictAndPublish(
    submission: NonNullable<Awaited<ReturnType<SubmissionRepository['findById']>>>,
    judgeResult: Awaited<ReturnType<SubmissionJudgeService['judge']>>,
  ) {
    const persisted = await this.dependencies.submissionRepository.finalize(submission.id, {
      status: judgeResult.status,
      testCasesPassed: judgeResult.passedCount,
      testCasesTotal: judgeResult.totalCount,
      executionTime: judgeResult.executionTime,
      memoryUsed: judgeResult.memoryUsed,
      errorMessage: judgeResult.errorMessage,
    });
    if (!persisted) return;
    console.log(`Submission ${submission.id} evaluated: ${judgeResult.status} (${judgeResult.passedCount}/${judgeResult.totalCount})`);
    await this.publishBestEffort({
      submissionId: submission.id, userId: submission.user_id, problemId: submission.problem_id,
      status: judgeResult.status, testCasesPassed: judgeResult.passedCount,
      testCasesTotal: judgeResult.totalCount, matchId: submission.match_id ?? undefined,
    });
  }

  async process(rawData: unknown) {
    if (!isSubmissionJobData(rawData)) {
      throw new Error('Invalid submission job data');
    }

    const { submissionId } = rawData;

    const submission = await this.dependencies.submissionRepository.findById(submissionId);
    if (!submission) {
      console.error(`Submission ${submissionId} not found in database`);
      return;
    }

    if (submission.status !== 'PENDING' && submission.status !== 'PROCESSING') return;
    if (submission.status === 'PENDING' && !await this.dependencies.submissionRepository.claimPending(submissionId)) return;

    if (!isLanguageKey(submission.language)) {
      throw new Error(`Unsupported stored submission language: ${submission.language}`);
    }

    const context = await this.loadJudgingContext(submission);
    if (!context) return;

    const judgeResult = await this.dependencies.judgeService.judge({
      code: submission.code,
      language: submission.language,
      ...context,
      judge0Url: this.dependencies.getJudge0Url(),
    });
    await this.persistVerdictAndPublish(submission, judgeResult);
  }

  async handleFinalFailure(rawData: unknown, _error: Error) {
    if (!isSubmissionJobData(rawData)) {
      return;
    }

    const submission = await this.dependencies.submissionRepository.findById(rawData.submissionId);
    if (!submission) {
      return;
    }

    const persisted = await this.dependencies.submissionRepository.markSystemError(
      rawData.submissionId, 'Judging failed after retry attempts');
    if (!persisted) return;

    await this.publishBestEffort({
      submissionId: rawData.submissionId,
      userId: submission.user_id,
      problemId: submission.problem_id,
      status: 'SYSTEM_ERROR',
      testCasesPassed: submission.test_cases_passed,
      testCasesTotal: submission.test_cases_total,
      matchId: submission.match_id ?? undefined,
    });
  }

  private async persistSystemError(submission: NonNullable<Awaited<ReturnType<SubmissionRepository['findById']>>>, message: string) {
    const persisted = await this.dependencies.submissionRepository.markSystemError(submission.id, message);
    if (!persisted) return;
    await this.publishBestEffort({
      submissionId: submission.id, userId: submission.user_id, problemId: submission.problem_id,
      status: 'SYSTEM_ERROR', testCasesPassed: submission.test_cases_passed,
      testCasesTotal: submission.test_cases_total, matchId: submission.match_id ?? undefined,
    });
  }

  private async publishBestEffort(result: Parameters<SubmissionPublisher['publishFinalResult']>[0]) {
    try { await this.dependencies.publisher.publishFinalResult(result); }
    catch (error) { console.error(`Realtime publish failed for submission ${result.submissionId}`, error); }
  }
}

export const createSubmissionProcessor = () => {
  return new SubmissionProcessor({
    submissionRepository,
    judgingContextRepository,
    judgeService: submissionJudgeService,
    publisher: submissionPublisher,
    getJudge0Url: () => env.JUDGE0_URL,
  });
};
