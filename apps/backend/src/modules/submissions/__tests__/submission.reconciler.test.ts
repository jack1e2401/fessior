import { SubmissionReconciler } from '../submission.reconciler';

describe('stale PENDING reconciliation', () => {
  const stale = [{ id: 'sub-1' }, { id: 'sub-2' }];
  const repository = {
    findStalePending: jest.fn(),
    markPendingSystemError: jest.fn(),
  };
  const queue = { getJob: jest.fn(), add: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findStalePending.mockResolvedValue(stale);
    queue.getJob.mockResolvedValue(null);
    queue.add.mockResolvedValue(undefined);
  });

  it('re-enqueues a bounded stale batch using deterministic IDs', async () => {
    const reconciler = new SubmissionReconciler(repository as any, queue as any, { staleMs: 60_000, batchSize: 50 });
    await reconciler.runOnce(new Date('2026-01-01T01:00:00Z'));
    expect(repository.findStalePending).toHaveBeenCalledWith(new Date('2026-01-01T00:59:00Z'), 50);
    expect(queue.add).toHaveBeenNthCalledWith(1, 'submission-job', { submissionId: 'sub-1' }, { jobId: 'sub-1' });
    expect(queue.add).toHaveBeenNthCalledWith(2, 'submission-job', { submissionId: 'sub-2' }, { jobId: 'sub-2' });
  });

  it('does not add another job when one already exists', async () => {
    queue.getJob.mockResolvedValue({ getState: async () => 'waiting' });
    const reconciler = new SubmissionReconciler(repository as any, queue as any, { staleMs: 60_000, batchSize: 50 });
    await reconciler.runOnce(new Date('2026-01-01T01:00:00Z'));
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('settles a stale PENDING record if its existing job exhausted retries', async () => {
    queue.getJob.mockResolvedValue({ getState: async () => 'failed' });
    const reconciler = new SubmissionReconciler(repository as any, queue as any, { staleMs: 60_000, batchSize: 50 });
    await reconciler.runOnce(new Date('2026-01-01T01:00:00Z'));
    expect(repository.markPendingSystemError).toHaveBeenCalledWith('sub-1', 'Judging failed after retry attempts');
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('settles a stale PENDING record if its job completed without a verdict', async () => {
    queue.getJob.mockResolvedValue({ getState: async () => 'completed' });
    const reconciler = new SubmissionReconciler(repository as any, queue as any, { staleMs: 60_000, batchSize: 50 });
    await reconciler.runOnce(new Date('2026-01-01T01:00:00Z'));
    expect(repository.markPendingSystemError).toHaveBeenCalledTimes(2);
    expect(queue.add).not.toHaveBeenCalled();
  });
});
