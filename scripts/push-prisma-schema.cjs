const { spawnSync } = require('child_process');

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://root:ocj_root_secret@localhost:3307/ocj_main_db';
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
