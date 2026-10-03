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

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
  REDIS_PORT: z.coerce.number().int().positive(),

  JUDGE0_URL: z.string().url('JUDGE0_URL must be a valid URL'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
