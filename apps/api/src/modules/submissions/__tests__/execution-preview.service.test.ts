jest.mock('../../../config/env', () => ({ env: { JUDGE0_URL: 'http://judge0.test' } }));
jest.mock('../submission.repository', () => ({
  submissionRepository: {
    findProblem: jest.fn(),
    findExampleTestcases: jest.fn(),
    findExampleTestcasesByIds: jest.fn(),
  },
}));
jest.mock('@ocj/executor', () => ({
  LANGUAGE_IDS: { python: 71 },
  executeTestCase: jest.fn().mockResolvedValue({ status: 'ACCEPTED', actualOutput: 'ok\n', time: 4, memory: 1024, error: null }),
}));

import { executeTestCase } from '@ocj/executor';
import { ExecutionPreviewService } from '../execution-preview.service';
import { submissionRepository } from '../submission.repository';

describe('ExecutionPreviewService custom cases', () => {
  it('runs every submitted case and distinguishes execution from an output comparison', async () => {
    (submissionRepository.findProblem as jest.Mock).mockResolvedValue({ id: 'p1', time_limit: 1000, memory_limit: 128 });
    const result = await new ExecutionPreviewService().runCode({
      problemId: 'p1', code: 'print("ok")', language: 'python',
      customTestcases: [{ input: 'first', expectedOutput: 'ok\n' }, { input: 'second' }],
    });

    expect(result).toEqual([
      expect.objectContaining({ position: 1, status: 'ACCEPTED', hasExpectedOutput: true }),
      expect.objectContaining({ position: 2, status: 'EXECUTED', hasExpectedOutput: false }),
    ]);
    expect(executeTestCase).toHaveBeenNthCalledWith(1, 'print("ok")', 71, 'first', 'ok\n', 1000, 128, { judge0Url: 'http://judge0.test' });
    expect(executeTestCase).toHaveBeenNthCalledWith(2, 'print("ok")', 71, 'second', null, 1000, 128, { judge0Url: 'http://judge0.test' });
  });
});
