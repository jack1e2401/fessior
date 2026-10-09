import type { Queue } from 'bullmq';
import type { SubmissionRepository } from './submission.repository';

type ReconcileQueue = Pick<Queue, 'getJob' | 'add'>;

export class SubmissionReconciler {
  private running = false;

  constructor(
    private readonly repository: Pick<SubmissionRepository, 'findStalePending' | 'markPendingSystemError'>,
    private readonly queue: ReconcileQueue,
    private readonly options: { staleMs: number; batchSize: number },
  ) {}

  async runOnce(now = new Date()) {
    if (this.running) return;
    this.running = true;
    try {
      const cutoff = new Date(now.getTime() - this.options.staleMs);
      const pending = await this.repository.findStalePending(cutoff, this.options.batchSize);
      for (const submission of pending) {
        try {
          const job = await this.queue.getJob(submission.id);
          if (job) {
            const state = await job.getState();
            if (state === 'failed' || state === 'completed') {
              await this.repository.markPendingSystemError(submission.id, 'Judging failed after retry attempts');
            }
            continue;
          }
          await this.queue.add('submission-job', { submissionId: submission.id }, { jobId: submission.id });
        } catch (error) {
          console.error(`Reconciliation failed for submission ${submission.id}`, error);
        }
      }
    } finally { this.running = false; }
  }
}
