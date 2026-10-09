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
    input?: string;
    exampleTestcaseIds?: string[];
    customTestcases?: Array<{ input: string; expectedOutput?: string }>;
  }) {
    const judge0Url = env.JUDGE0_URL;
    const languageId = LANGUAGE_IDS[data.language as LanguageKey];

    if (!languageId) {
      throw new AppError(`Unsupported language: ${data.language}`, 400);
    }

    let testcasesToRun: Array<{ input: string; output: string; is_example: boolean; has_expected_output: boolean }> = [];
    let problem: Awaited<ReturnType<typeof submissionRepository.findProblem>> = null;
    const customInput = data.customInput ?? data.input;
    const hasCustomTestcases = Boolean(data.customTestcases?.length);

    if (data.problemId) {
      problem = await submissionRepository.findProblem(data.problemId);
      if (!problem) {
        throw new AppError('Problem not found', 404);
      }

      if (hasCustomTestcases) {
        testcasesToRun = data.customTestcases!.map((testcase) => ({
          input: testcase.input,
          output: testcase.expectedOutput ?? '',
          is_example: false,
          has_expected_output: testcase.expectedOutput !== undefined,
        }));
      } else if (customInput !== undefined && customInput !== null) {
        testcasesToRun = [{ input: customInput, output: '', is_example: false, has_expected_output: false }];
      } else if (data.exampleTestcaseIds?.length) {
        if (!problem.active_testcase_set_id) {
          throw new AppError('Problem testcase set changed. Reload the problem and try again.', 409);
        }
        testcasesToRun = (await submissionRepository.findExampleTestcasesByIds(
          problem.active_testcase_set_id,
          data.exampleTestcaseIds,
        )).map((testcase) => ({ ...testcase, has_expected_output: true }));
        if (testcasesToRun.length !== new Set(data.exampleTestcaseIds).size) {
          throw new AppError('Example testcases changed. Reload the problem and try again.', 409);
        }
      } else {
        testcasesToRun = problem.active_testcase_set_id
          ? (await submissionRepository.findExampleTestcases(problem.active_testcase_set_id)).map((testcase) => ({ ...testcase, has_expected_output: true }))
          : [];
      }
    } else {
      if (hasCustomTestcases) {
        testcasesToRun = data.customTestcases!.map((testcase) => ({
          input: testcase.input,
          output: testcase.expectedOutput ?? '',
          is_example: false,
          has_expected_output: testcase.expectedOutput !== undefined,
        }));
      } else {
      testcasesToRun = data.exampleTestcaseIds?.length
        ? []
        : [{ input: customInput ?? '', output: '', is_example: false, has_expected_output: false }];
      if (data.exampleTestcaseIds?.length) {
        throw new AppError('Example testcases require a problem.', 400);
      }
      }
    }

    const results = [];
    for (const tc of testcasesToRun) {
      const timeLimit = problem?.time_limit ?? DEFAULT_LIMITS.TIME_LIMIT_MS;
      const memoryLimit = problem?.memory_limit ?? DEFAULT_LIMITS.MEMORY_LIMIT_MB;
      let result;
      try {
        result = await executeTestCase(
          data.code,
          languageId,
          tc.input,
          tc.has_expected_output || tc.is_example ? tc.output : null,
          timeLimit,
          memoryLimit,
          {
            judge0Url,
          }
        );
      } catch (error: any) {
        console.error('Judge0 preview request failed', error);
        throw new AppError('Judge0 sandbox unavailable', 503);
      }
      results.push({
        position: results.length + 1,
        status: result.status === 'ACCEPTED' && !tc.has_expected_output && !tc.is_example ? 'EXECUTED' : result.status,
        executionStatus: result.status,
        hasExpectedOutput: tc.has_expected_output || tc.is_example,
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
