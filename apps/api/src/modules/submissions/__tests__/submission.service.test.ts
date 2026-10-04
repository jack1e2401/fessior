import { submissionService } from '../submission.service';
import { submissionRepository } from '../submission.repository';
import { submissionQueue } from '../../../config/queue';
import { AppError } from '../../../errors/AppError';

jest.mock('../submission.repository', () => ({
  submissionRepository: {
    findProblem: jest.fn(),
    createPendingSubmissionForActiveSet: jest.fn(),
    findByIdWithProblem: jest.fn(),
    findUserSubmissions: jest.fn(),
  },
}));

jest.mock('../../../config/queue', () => ({
  submissionQueue: {
    add: jest.fn(),
  },
}));

describe('SubmissionService Unit Tests', () => {
  const mockProblem = {
    id: 'prob-1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'EASY',
    time_limit: 1000,
    active_testcase_set_id: 'set-v1',
  };

  const rawSubmission = {
    id: 'sub-123',
    user_id: 'user-1',
    problem_id: 'prob-1',
    testcase_set_id: 'set-v1',
    code: 'print("hello")',
    language: 'python',
    status: 'PENDING',
    execution_time: null,
    memory_used: null,
    error_message: null,
    test_cases_passed: 0,
    test_cases_total: 0,
    match_id: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    problem: mockProblem,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submit', () => {
    it('should throw 404 if problem does not exist', async () => {
      (submissionRepository.createPendingSubmissionForActiveSet as jest.Mock).mockResolvedValue({ kind: 'problem-not-found' });

      await expect(
        submissionService.submit('user-1', {
          problemId: 'non-existent',
          code: 'print(1)',
          language: 'python',
        })
      ).rejects.toThrow(new AppError('Problem not found', 404));

      expect(submissionQueue.add).not.toHaveBeenCalled();
    });

    it('should create pending submission and enqueue job', async () => {
      (submissionRepository.createPendingSubmissionForActiveSet as jest.Mock).mockResolvedValue({ kind: 'created', submission: rawSubmission });
      (submissionQueue.add as jest.Mock).mockResolvedValue({ id: 'job-1' });

      const result = await submissionService.submit('user-1', {
        problemId: 'two-sum',
        code: 'print("hello")',
        language: 'python',
      });

      expect(result).toMatchObject({
        id: 'sub-123',
        userId: 'user-1',
        problemId: 'prob-1',
        testcaseSetId: 'set-v1',
        code: 'print("hello")',
        language: 'python',
        status: 'PENDING',
        testCasesPassed: 0,
        testCasesTotal: 0,
      });

      expect(submissionQueue.add).toHaveBeenCalledWith('submission-job', {
        submissionId: 'sub-123',
        code: 'print("hello")',
        language: 'python',
        problemId: 'prob-1',
      });
      expect(submissionRepository.createPendingSubmissionForActiveSet).toHaveBeenCalledWith({
        userId: 'user-1',
        slugOrId: 'two-sum',
        code: 'print("hello")',
        language: 'python',
        matchId: null,
      });
    });

    it('rejects a problem without an active testcase set before enqueueing', async () => {
      (submissionRepository.createPendingSubmissionForActiveSet as jest.Mock).mockResolvedValue({ kind: 'no-active-set' });

      await expect(submissionService.submit('user-1', {
        problemId: 'two-sum', code: 'print(1)', language: 'python',
      })).rejects.toThrow(new AppError('Problem has no active testcase set', 409));
      expect(submissionQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('getSubmissionDetails', () => {
    it('should throw 404 if submission is not found', async () => {
      (submissionRepository.findByIdWithProblem as jest.Mock).mockResolvedValue(null);

      await expect(
        submissionService.getSubmissionDetails('sub-unknown', 'user-1')
      ).rejects.toThrow(new AppError('Submission not found', 404));
    });

    it('should throw 403 if user is neither owner nor admin', async () => {
      (submissionRepository.findByIdWithProblem as jest.Mock).mockResolvedValue(rawSubmission);

      await expect(
        submissionService.getSubmissionDetails('sub-123', 'other-user', false)
      ).rejects.toThrow(new AppError('Forbidden: Access denied to this submission', 403));
    });

    it('should return submission details for owner', async () => {
      (submissionRepository.findByIdWithProblem as jest.Mock).mockResolvedValue(rawSubmission);

      const result = await submissionService.getSubmissionDetails('sub-123', 'user-1', false);
      expect(result.id).toBe('sub-123');
      expect(result.userId).toBe('user-1');
      expect(result.problem?.slug).toBe('two-sum');
    });

    it('should return submission details for admin even if not owner', async () => {
      (submissionRepository.findByIdWithProblem as jest.Mock).mockResolvedValue(rawSubmission);

      const result = await submissionService.getSubmissionDetails('sub-123', 'admin-user', true);
      expect(result.id).toBe('sub-123');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('getUserSubmissions', () => {
    it('should return paginated submissions with formatted items', async () => {
      (submissionRepository.findProblem as jest.Mock).mockResolvedValue(mockProblem);
      (submissionRepository.findUserSubmissions as jest.Mock).mockResolvedValue([1, [rawSubmission]]);

      const result = await submissionService.getUserSubmissions('user-1', {
        problemId: 'two-sum',
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('sub-123');
      expect(result.items[0].userId).toBe('user-1');
    });
  });
});
