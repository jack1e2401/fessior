import dotenv from 'dotenv';

dotenv.config();

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://root:ocj_root_secret@localhost:3307/ocj_main_db';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
