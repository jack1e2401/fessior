// ============================================================
// Shared Enums (const objects for erasableSyntaxOnly compatibility)
// ============================================================

export * from './queue';
export * from './socket';
export * from './submission';
export * from './routes';

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN'
} as const;
export type Role = typeof Role[keyof typeof Role];

export const SubmissionStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  ACCEPTED: 'ACCEPTED',
  WA: 'WA',
  TLE: 'TLE',
  MLE: 'MLE',
  RE: 'RE',
  CE: 'CE',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
} as const;
export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus];

export const LanguageSlug = {
  CPP17: 'cpp17',
  JAVA21: 'java21',
  PYTHON3: 'python3'
} as const;
export type LanguageSlug = typeof LanguageSlug[keyof typeof LanguageSlug];

export const ProblemDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
} as const;
export type ProblemDifficulty = typeof ProblemDifficulty[keyof typeof ProblemDifficulty];

// --- New Enums ---

export const ReportType = {
  BUG: 'BUG',
  SUGGESTION: 'SUGGESTION',
  OTHER: 'OTHER'
} as const;
export type ReportType = typeof ReportType[keyof typeof ReportType];

export const ReportStatus = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED'
} as const;
export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

export const FriendshipStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  BLOCKED: 'BLOCKED'
} as const;
export type FriendshipStatus = typeof FriendshipStatus[keyof typeof FriendshipStatus];

export const MatchStatus = {
  PENDING: 'PENDING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED'
} as const;
export type MatchStatus = typeof MatchStatus[keyof typeof MatchStatus];

export const RoomStatus = {
  WAITING: 'WAITING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED'
} as const;
export type RoomStatus = typeof RoomStatus[keyof typeof RoomStatus];

export const NotificationType = {
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',
  MATCH_FOUND: 'MATCH_FOUND',
  MATCH_STARTED: 'MATCH_STARTED',
  MATCH_ENDED: 'MATCH_ENDED',
  CONTEST_STARTING: 'CONTEST_STARTING',
  CONTEST_ENDED: 'CONTEST_ENDED',
  PROBLEM_SOLVED: 'PROBLEM_SOLVED',
  BADGE_EARNED: 'BADGE_EARNED',
  ROOM_INVITE: 'ROOM_INVITE',
  SYSTEM: 'SYSTEM',
  RATING_CHANGE: 'RATING_CHANGE',
  NEW_COMMENT: 'NEW_COMMENT',
  REPORT_RESOLVED: 'REPORT_RESOLVED'
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const ContestStatus = {
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  ENDED: 'ENDED'
} as const;
export type ContestStatus = typeof ContestStatus[keyof typeof ContestStatus];

export const ShopItemCategory = {
  AVATAR: 'AVATAR',
  BADGE: 'BADGE',
  THEME: 'THEME',
  STICKER: 'STICKER',
  EFFECT: 'EFFECT',
  OTHER: 'OTHER'
} as const;
export type ShopItemCategory = typeof ShopItemCategory[keyof typeof ShopItemCategory];

// ============================================================
// Utility Types
// ============================================================

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type ValueOf<T> = T[keyof T];

// ============================================================
// Existing Entity Interfaces (preserved, lightly normalized)
// ============================================================

export interface QueueJobPayload {
  submissionId: string;
  code: string;
  language: LanguageSlug;
  testcases: any[];
  timeLimit: number;
  memoryLimit: number;
}

export interface IUser {
  id: string;
  userId?: string;
  username: string;
  email?: string;
  role: Role | 'USER' | 'ADMIN';
  elo_rating?: number;
  eloRating?: number;
  streak_count?: number;
  streakCount?: number;
  max_streak?: number;
  maxStreak?: number;
  avatar?: string;
  avatar_url?: string;
  avatarUrl?: string;
}

export interface IProblem {
  id?: string;
  _id?: string;
  mongo_problem_id?: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty | 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit?: number;
  memoryLimit?: number;
  tags?: any[];
  starterCodes?: {
    cpp?: string;
    java?: string;
    python?: string;
    [key: string]: string | undefined;
  };
}

export interface ISubmission {
  id?: string;
  _id?: string;
  problemId: string;
  userId: string;
  code: string;
  language: LanguageSlug | 'python' | 'cpp' | 'java';
  status: SubmissionStatus | 'PENDING' | 'PROCESSING' | 'ACCEPTED' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'SYSTEM_ERROR' | 'ERROR';
  errorMessage?: string;
  testCasesPassed?: number;
  testCasesTotal?: number;
  timeLimit?: number;
  memoryLimit?: number;
  aiFeedback?: string;
  createdAt?: string | Date;
}

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
  status: 'PENDING' | 'PLAYING' | 'FINISHED';
  winner_id?: string | null;
  started_at?: string | Date;
  ended_at?: string | Date | null;
  player1?: IUser;
  player2?: IUser;
  participants?: IMatchParticipant[];
  problem?: IProblem;
}

export interface IContestRegistration {
  contest_id: string;
  user_id: string;
  registered_at: string | Date;
  user?: IUser;
}

export interface IContestProblem {
  contest_id: string;
  mongo_problem_id: string;
  points: number;
  order: number;
  problem?: IProblem;
}

export interface IContest {
  id: string;
  title: string;
  description?: string | null;
  start_time: string | Date;
  end_time: string | Date;
  status: ContestStatus | 'UPCOMING' | 'REGISTRATION' | 'ONGOING' | 'ENDED' | 'RESULTS';
  created_at?: string | Date;
  updated_at?: string | Date;
  problems?: IContestProblem[];
  registrations?: IContestRegistration[];
  _count?: { registrations: number };
}

export interface IReport {
  id: string;
  userId: string;
  problemId?: string | null;
  type: 'BUG' | 'SUGGESTION' | 'OTHER';
  content: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  createdAt?: string | Date;
}

// ============================================================
// New Entity Interfaces
// ============================================================

export interface ITag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface IFriendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: string | Date;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string | Date;
}

export interface IShopItem {
  id: string;
  name: string;
  description?: string;
  category: ShopItemCategory;
  price: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface IInventoryItem {
  id: string;
  userId: string;
  shopItemId: string;
  quantity: number;
  isEquipped: boolean;
  shopItem?: IShopItem;
}

export interface IUserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string | Date;
  badge?: IBadge;
}

export interface IBadge {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  category: string;
}

export interface IEloHistory {
  id: string;
  userId: string;
  elo: number;
  change: number;
  reason?: string;
  matchId?: string | null;
  createdAt: string | Date;
}

export interface IUserActivity {
  id: string;
  userId: string;
  date: string;
  submissionCount: number;
  solvedCount: number;
  streakCount: number;
}

export interface IUserTagStats {
  id: string;
  userId: string;
  tagId: string;
  solvedCount: number;
}

export interface IContestScoreboardEntry {
  rank: number;
  userId: string;
  username: string;
  solved: number;
  totalTime: number;
  score: number;
}

export interface ISession {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string | Date;
  expiresAt: string | Date;
  isRevoked: boolean;
}

// ============================================================
// API Response DTOs
// ============================================================

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// Auth DTOs
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ============================================================
// Problem DTOs
// ============================================================

export interface ProblemListQuery {
  search?: string;
  difficulty?: ProblemDifficulty;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'difficulty' | 'createdAt' | 'solvedCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProblemRequest {
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  timeLimit?: number;
  memoryLimit?: number;
  tags?: string[];
  starterCodes?: {
    cpp?: string;
    java?: string;
    python?: string;
  };
  testcases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
}

export interface UpdateProblemRequest {
  title?: string;
  slug?: string;
  description?: string;
  difficulty?: ProblemDifficulty;
  timeLimit?: number;
  memoryLimit?: number;
  tags?: string[];
  starterCodes?: {
    cpp?: string;
    java?: string;
    python?: string;
  };
}

// ============================================================
// Submission DTOs
// ============================================================

export interface SubmissionListQuery {
  userId?: string;
  problemId?: string;
  status?: SubmissionStatus;
  language?: LanguageSlug;
  page?: number;
  limit?: number;
  contestId?: string;
}

export interface SubmitCodeRequest {
  problemId: string;
  code: string;
  language: LanguageSlug;
  matchId?: string;
  contestId?: string;
}

export interface RunCodeRequest {
  problemId: string;
  code: string;
  language: LanguageSlug;
  input?: string;
}

// ============================================================
// Contest DTOs
// ============================================================

export interface CreateContestRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  problems?: string[];
}

export interface UpdateContestRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  problems?: string[];
}

export interface ContestRegistrationRequest {
  contestId: string;
}

// ============================================================
// Friend DTOs
// ============================================================

export interface FriendRequestAction {
  action: 'accept' | 'reject' | 'block';
}

// ============================================================
// Report DTOs
// ============================================================

export interface CreateReportRequest {
  type: ReportType;
  content: string;
  problemId?: string;
}

// ============================================================
// Shop DTOs
// ============================================================

export interface ShopPurchaseRequest {
  shopItemId: string;
}

// ============================================================
// Notification DTOs
// ============================================================

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

// ============================================================
// User DTOs
// ============================================================

export interface UserUpdateProfileRequest {
  username?: string;
  avatarUrl?: string;
}

// ============================================================
// Socket Event Types
// ============================================================

export interface SocketQueueStatus {
  queueSize: number;
  estimatedWait: number;
}

export interface SocketMatchFound {
  match: IMatch;
  opponent: IUser;
  problem: IProblem;
}

export interface SocketRivalSubmission {
  userId: string;
  status: SubmissionStatus;
  testCasesPassed: number;
  testCasesTotal: number;
}

export interface SocketMatchEnded {
  match: IMatch;
  winner: IUser;
  ratingChange: number;
}

export interface SocketNotification {
  notification: INotification;
}
