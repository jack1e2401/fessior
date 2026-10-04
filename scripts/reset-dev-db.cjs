const { spawnSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const target = new URL(databaseUrl);
if (
  !['localhost', '127.0.0.1'].includes(target.hostname) ||
  target.port !== '3307' ||
  target.pathname !== '/ocj_main_db'
) {
  console.error('Refusing to reset a database other than localhost:3307/ocj_main_db');
  process.exit(1);
}

const prismaCli = path.resolve(__dirname, '../node_modules/prisma/build/index.js');
const schema = path.resolve(__dirname, '../apps/api/prisma/schema.prisma');
const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'reset', '--schema', schema, '--force', '--skip-seed'], {
  stdio: 'inherit',
  env: process.env,
});
if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
