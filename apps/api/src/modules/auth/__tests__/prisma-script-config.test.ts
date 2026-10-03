import { spawnSync } from 'node:child_process';
import path from 'node:path';

describe('root Prisma scripts', () => {
  it.each(['generate-prisma-client.cjs', 'push-prisma-schema.cjs'])(
    '%s refuses to run without DATABASE_URL',
    (script) => {
      const root = path.resolve(__dirname, '../../../../../..');
      const result = spawnSync(process.execPath, [path.join(root, 'scripts', script)], {
        cwd: root,
        env: { ...process.env, DATABASE_URL: '' },
        encoding: 'utf8',
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr + result.stdout).toMatch(/DATABASE_URL is required/);
    }
  );
});
