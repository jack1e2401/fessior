export const QUEUE_NAMES = {
  SUBMISSION: 'submission_queue',
} as const;

export const SUBMISSION_QUEUE = QUEUE_NAMES.SUBMISSION;

export const REDIS_CHANNELS = {
  SUBMISSION_UPDATES: 'submission-updates',
} as const;
