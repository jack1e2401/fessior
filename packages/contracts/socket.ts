export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  JOIN_QUEUE: 'join-queue',
  LEAVE_QUEUE: 'leave-queue',
  FORFEIT_MATCH: 'forfeit-match',
  JOIN_MATCH: 'join-match',
  LEAVE_MATCH: 'leave-match',
  QUEUE_STATUS: 'queue-status',
  MATCH_FOUND: 'match-found',
  RIVAL_SUBMISSION: 'rival-submission',
  MATCH_ENDED: 'match-ended',
} as const;

export const SOCKET_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  match: (matchId: string) => `match:${matchId}`,
} as const;

export const REDIS_KEYS = {
  ONLINE_USERS: 'online_users',
} as const;
