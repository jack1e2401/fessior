import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('root development commands', () => {
  const root = path.resolve(__dirname, '../../../../..');
  const { scripts } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

  it('starts Docker infrastructure before the local app workspaces', () => {
    expect(scripts.dev).toContain('npm run infra:up');
    expect(scripts.dev).toContain('npm run db:setup');
    expect(scripts.dev).toContain('turbo run dev');
    expect(scripts).not.toHaveProperty('dev:hybrid');
    expect(scripts).not.toHaveProperty('dev:docker');
  });

  it.each(['db:generate', 'db:migrate'])('%s invokes Prisma directly', (script) => {
    expect(scripts[script]).toMatch(/^prisma /);
  });
});
