import type { IUser } from './auth';
import type { IProblem } from './problem';

export const MatchStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED',
  DRAW: 'DRAW',
} as const;
export type MatchStatus = typeof MatchStatus[keyof typeof MatchStatus];

export interface IMatchParticipant {
  id: string;
  match_id: string;
  user_id: string;
  status: 'CODING' | 'SUBMITTED_WA' | 'ACCEPTED';
  score_change: number;
  is_winner: boolean;
  joined_at: string | Date;
  user?: IUser;
}

export interface IMatch {
  id: string;
  problem_id: string;
  status: MatchStatus;
  winner_id?: string | null;
  started_at?: string | Date;
  ended_at?: string | Date | null;
  participants?: IMatchParticipant[];
  problem?: IProblem;
}
