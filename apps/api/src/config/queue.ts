import { Queue } from 'bullmq';
import { redisOptions } from './redis';
import { QUEUE_NAMES } from '@ocj/contracts';
import { SUBMISSION_QUEUE_OPTIONS } from '../modules/submissions/submission.constants';

export const submissionQueue = new Queue(QUEUE_NAMES.SUBMISSION, {
  connection: redisOptions,
  defaultJobOptions: SUBMISSION_QUEUE_OPTIONS,
});

console.log('Submission Queue initialized successfully');
