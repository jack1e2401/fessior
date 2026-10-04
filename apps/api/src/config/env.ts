import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

const cwdEnv = path.resolve(process.cwd(), '.env');
const rootEnv = path.resolve(__dirname, '../../../../.env');
if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(6868),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
  REDIS_PORT: z.coerce.number().int().positive(),
  SUBMISSION_RECONCILE_INTERVAL_MS: z.coerce.number().int().min(1000).default(30_000),
  SUBMISSION_RECONCILE_STALE_MS: z.coerce.number().int().min(1000).default(60_000),
  SUBMISSION_RECONCILE_BATCH_SIZE: z.coerce.number().int().min(1).max(200).default(50),

  JUDGE0_URL: z.string().url('JUDGE0_URL must be a valid URL'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
