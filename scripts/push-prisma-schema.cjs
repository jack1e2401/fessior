const { spawnSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
process.env.PRISMA_HIDE_UPDATE_MESSAGE = process.env.PRISMA_HIDE_UPDATE_MESSAGE || 'true';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['--workspace', 'api', 'run', 'db:push'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
