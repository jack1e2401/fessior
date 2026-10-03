import { Queue } from 'bullmq';
import { redisOptions } from './redis';
import { SUBMISSION_QUEUE } from '@ocj/contracts';

export const submissionQueue = new Queue(SUBMISSION_QUEUE, {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log('Submission Queue initialized successfully');
