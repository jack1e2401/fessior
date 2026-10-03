import { DEFAULT_LIMITS } from '@ocj/contracts';
import { executeTestCase, LANGUAGE_IDS, LanguageKey } from '@ocj/executor';
import { AppError } from '../../errors/AppError';
import { env } from '../../config/env';
import { submissionRepository } from './submission.repository';

export class ExecutionPreviewService {
  async runCode(data: {
    problemId?: string;
    code: string;
    language: 'cpp' | 'java' | 'python';
    customInput?: string;
  }) {
    const judge0Url = env.JUDGE0_URL;
    const languageId = LANGUAGE_IDS[data.language as LanguageKey];

    if (!languageId) {
      throw new AppError(`Unsupported language: ${data.language}`, 400);
    }

    let testcasesToRun: Array<{ input: string; output: string; is_example: boolean }> = [];
    let problem: Awaited<ReturnType<typeof submissionRepository.findProblem>> = null;

    if (data.problemId) {
      problem = await submissionRepository.findProblem(data.problemId);
      if (!problem) {
        throw new AppError('Problem not found', 404);
      }

      if (data.customInput !== undefined && data.customInput !== null) {
        testcasesToRun = [{ input: data.customInput, output: '', is_example: false }];
      } else {
        testcasesToRun = await submissionRepository.findExampleTestcases(problem.id);
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

export const executionPreviewService = new ExecutionPreviewService();
