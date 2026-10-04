import { AppError } from '../../errors/AppError';
import { problemRepository } from '../problems/problem.repository';
import { testcaseRepository } from './testcase.repository';

export class TestcaseService {
  async addTestcase(problemId: string, isExample: boolean, input: string, output: string) {
    const problem = await problemRepository.getProblemBySlug(problemId);
    if (!problem) throw new AppError('Problem not found', 404);
    return testcaseRepository.addTestcase(problem.id, { isExample, input, output });
  }

  async getTestcases(problemId: string, isExampleOnly = false) {
    const problem = await problemRepository.getProblemBySlug(problemId);
    if (!problem) throw new AppError('Problem not found', 404);
    return testcaseRepository.getTestcases(problem.id, isExampleOnly);
  }

  async deleteTestcase(problemId: string, testcaseId: string) {
    const problem = await problemRepository.getProblemBySlug(problemId);
    if (!problem) throw new AppError('Problem not found', 404);
    const deleted = await testcaseRepository.deleteTestcase(problem.id, testcaseId);
    if (!deleted) throw new AppError('Testcase not found in active set', 404);
    return deleted;
  }
}

export const testcaseService = new TestcaseService();
