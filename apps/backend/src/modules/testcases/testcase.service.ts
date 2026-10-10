import { AppError } from '../../errors/AppError';
import { problemRepository } from '../problems/problem.repository';
import { testcaseRepository } from './testcase.repository';
import { parseTestcaseArchive } from './ingestion/archive-parser';

export class TestcaseService {
  async listTestcaseSetSummaries(problemId: string, page: number, limit: number) {
    const problem = await problemRepository.getProblemBySlug(problemId);
    if (!problem) throw new AppError('Problem not found', 404);
    const result = await testcaseRepository.listSetSummaries(problem.id, page, limit);
    return { ...result, page, limit };
  }

  async importArchive(problemId: string, archivePath: string, checksum: string) {
    let cases: Awaited<ReturnType<typeof parseTestcaseArchive>>;
    try { cases = await parseTestcaseArchive(archivePath); }
    catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Testcase archive could not be read', 422, {
        stage: 'archive_structure', code: 'INVALID_ZIP', databaseState: 'UNCHANGED',
      });
    }
    const problem = await problemRepository.getProblemBySlug(problemId);
    if (!problem) throw new AppError('Problem not found', 404, {
      stage: 'activation', code: 'PROBLEM_NOT_FOUND', databaseState: 'UNCHANGED',
      completedSteps: ['archive_structure', 'safe_paths', 'safe_entries', 'manifest', 'testcase_pairs', 'resource_limits'],
    });
    try { return await testcaseRepository.importSet(problem.id, checksum, cases); }
    catch (error) {
      if (error instanceof AppError && error.statusCode === 409) {
        throw new AppError(error.message, error.statusCode, {
          stage: 'activation', code: 'ACTIVATION_CONFLICT', databaseState: 'UNCHANGED',
          completedSteps: ['archive_structure', 'safe_paths', 'safe_entries', 'manifest', 'testcase_pairs', 'resource_limits'],
        });
      }
      throw new AppError('Testcase import result could not be confirmed', 500, {
        stage: 'activation', code: 'ACTIVATION_RESULT_UNKNOWN', databaseState: 'UNKNOWN',
        completedSteps: ['archive_structure', 'safe_paths', 'safe_entries', 'manifest', 'testcase_pairs', 'resource_limits'],
      });
    }
  }

  async activateTestcaseSet(problemId: string, testcaseSetId: string) {
    const problem = await problemRepository.getProblemBySlug(problemId);
    if (!problem) throw new AppError('Problem not found', 404);
    const set = await testcaseRepository.activateTestcaseSet(problem.id, testcaseSetId);
    if (!set) throw new AppError('Testcase set not found for problem', 404);
    return { testcaseSetId: set.id, version: set.version, active: true as const };
  }
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
