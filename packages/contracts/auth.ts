export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = typeof Role[keyof typeof Role];

export interface IUser {
  id: string;
  username: string;
  email?: string;
  full_name?: string | null;
  bio?: string | null;
  role: Role;
  elo_rating?: number;
  eloRating?: number;
  avatar?: string;
  avatar_url?: string | null;
  avatarUrl?: string;
}

export interface UpdateProfileRequest {
  username: string;
  full_name: string | null;
  bio: string | null;
}
