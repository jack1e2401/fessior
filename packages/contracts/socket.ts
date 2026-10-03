export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  JOIN_QUEUE: 'join-queue',
  LEAVE_QUEUE: 'leave-queue',
  FORFEIT_MATCH: 'forfeit-match',
  QUEUE_STATUS: 'queue-status',
  MATCH_FOUND: 'match-found',
  RIVAL_SUBMISSION: 'rival-submission',
  MATCH_ENDED: 'match-ended',
} as const;
