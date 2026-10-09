export interface ILeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  eloRating: number;
}

export interface PaginatedResult<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}
