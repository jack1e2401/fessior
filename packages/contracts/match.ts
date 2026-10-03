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
  player1_id?: string | null;
  player2_id?: string | null;
  problem_id: string;
  status: MatchStatus;
  winner_id?: string | null;
  started_at?: string | Date;
  ended_at?: string | Date | null;
  player1?: IUser;
  player2?: IUser;
  participants?: IMatchParticipant[];
  problem?: IProblem;
}
