export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = typeof Role[keyof typeof Role];

export interface IUser {
  id: string;
  username: string;
  email?: string;
  role: Role;
  elo_rating?: number;
  eloRating?: number;
  streak_count?: number;
  avatar?: string;
  avatar_url?: string | null;
  avatarUrl?: string;
  full_name?: string | null;
}

export interface UserUpdateProfileRequest {
  full_name?: string;
  bio?: string;
  avatar_url?: string | null;
}
