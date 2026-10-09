import { DEFAULT_LIMITS } from '@ocj/contracts';
import { ExecutionResult, executeTestCase, getLanguageId, LanguageKey } from '@ocj/executor';
import { Problem, Testcase } from '@prisma/client';

type JudgeVerdict = ExecutionResult['status'];

interface JudgeSubmissionInput {
  code: string;
  language: LanguageKey;
  problem: Pick<Problem, 'time_limit' | 'memory_limit'>;
  testCases: Pick<Testcase, 'input' | 'output'>[];
  judge0Url: string;
}

export interface JudgeSubmissionResult {
  status: JudgeVerdict;
  passedCount: number;
  totalCount: number;
  executionTime: number;
  memoryUsed: number;
  errorMessage: string | null;
  caseResults: Array<{ position: number; status: JudgeVerdict; executionTime: number; memoryUsed: number }>;
}

export class SubmissionJudgeService {
  async judge(input: JudgeSubmissionInput): Promise<JudgeSubmissionResult> {
    const languageId = getLanguageId(input.language);
    const timeLimit = input.problem.time_limit || DEFAULT_LIMITS.TIME_LIMIT_MS;
    const memoryLimit = input.problem.memory_limit || DEFAULT_LIMITS.MEMORY_LIMIT_MB;

    let passedCount = 0;
    let executionTime = 0;
    let memoryUsed = 0;
    let status: JudgeVerdict = 'ACCEPTED';
    let errorMessage: string | null = null;
    const caseResults: JudgeSubmissionResult['caseResults'] = [];

    for (let i = 0; i < input.testCases.length; i++) {
      const testCase = input.testCases[i];
      const result = await executeTestCase(
        input.code,
        languageId,
        testCase.input,
        testCase.output,
        timeLimit,
        memoryLimit,
        {
          judge0Url: input.judge0Url,
        }
      );

      caseResults.push({ position: i + 1, status: result.status, executionTime: result.time, memoryUsed: result.memory });
      executionTime += result.time;
      memoryUsed = Math.max(memoryUsed, result.memory);

      if (result.status === 'ACCEPTED') {
        passedCount++;
      } else {
        status = result.status;
        errorMessage = result.error || `Failed on testcase ${i + 1}`;
        break;
      }

    }

    return {
      status,
      passedCount,
      totalCount: input.testCases.length,
      executionTime,
      memoryUsed,
      errorMessage,
      caseResults,
    };
  }
}

export const submissionJudgeService = new SubmissionJudgeService();
