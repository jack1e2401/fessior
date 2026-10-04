import { Worker, Job } from 'bullmq';
import { redisOptions } from '../config/redis';
import { createSubmissionProcessor } from './submission.processor';
import { QUEUE_NAMES } from '@ocj/contracts';

export const startSubmissionWorker = () => {
  const processor = createSubmissionProcessor();

  const worker = new Worker(
    QUEUE_NAMES.SUBMISSION,
    async (job: Job) => {
      const submissionId = (job.data as { submissionId?: unknown })?.submissionId ?? 'unknown';
      console.log(`Processing Job ${job.id} for Submission ${submissionId}`);

      try {
        await processor.process(job.data);
      } catch (err: any) {
        console.error(`Error processing job ${job.id}:`, err);
        throw err;
      }
    },
    {
      connection: redisOptions,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);

    if (!job) return;

    try {
      // BullMQ may fail a stalled job before attemptsMade reaches the retry count.
      if (await job.getState() !== 'failed') return;
      await processor.handleFinalFailure(job.data, err);
    } catch (failureErr) {
      console.error(`Failed to mark submission job ${job.id} as SYSTEM_ERROR:`, failureErr);
    }
  });

  worker.on('error', (err) => {
    console.error('Submission worker error:', err);
  });

  console.log('Submission Queue Worker started successfully');
  return worker;
};
