export const DEFAULT_LIMITS = {
  TIME_LIMIT_MS: 2000,
  MEMORY_LIMIT_MB: 256,
} as const;

export const SUPPORTED_LANGUAGES = ['cpp', 'java', 'python'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
