import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openapiDocument } from './index';

const modules = ['auth', 'users', 'problems', 'testcases', 'submissions', 'matches'] as const;
const mount = (module: string) =>
  module === 'testcases' ? '/api/v1/problems/{problemId}/testcases' : `/api/v1/${module}`;
const routePattern = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g;

describe('OpenAPI route coverage', () => {
  it('documents every canonical HTTP route and no removed Swagger markers remain', () => {
    const documented = new Set(
      Object.entries(openapiDocument.paths).flatMap(([url, methods]) =>
        Object.keys(methods).map((method) => `${method.toUpperCase()} ${url}`),
      ),
    );
    const actual = new Set<string>();

    for (const module of modules) {
      const singular =
        module === 'testcases'
          ? 'testcase'
          : module === 'submissions'
            ? 'submission'
            : module === 'matches'
              ? 'match'
              : module === 'problems'
                ? 'problem'
                : module === 'users'
                  ? 'user'
                  : 'auth';
      const source = readFileSync(resolve(__dirname, `../../modules/${module}/${singular}.route.ts`), 'utf8');
      expect(source).not.toContain('#swagger');
      for (const match of source.matchAll(routePattern)) {
        const path = match[2] === '/' ? '' : match[2];
        const url = `${mount(module)}${path}`.replace(/:([A-Za-z]+)/g, '{$1}');
        const normalized = module === 'problems' ? url.replace(/\{(?:slug|id)\}$/, '{problem}') : url;
        actual.add(`${match[1].toUpperCase()} ${normalized}`);
      }
    }

    expect(documented).toEqual(actual);
  });

  it('uses valid schema references and documents required path parameters', () => {
    const doc = JSON.stringify(openapiDocument);
    for (const ref of doc.matchAll(/#\/components\/schemas\/([A-Za-z]+)"/g)) {
      expect(openapiDocument.components.schemas).toHaveProperty(ref[1]);
    }
    for (const [url, methods] of Object.entries(openapiDocument.paths)) {
      for (const operation of Object.values(methods)) {
        for (const [, name] of url.matchAll(/\{([^}]+)\}/g)) {
          expect(operation.parameters).toEqual(
            expect.arrayContaining([expect.objectContaining({ name, in: 'path', required: true })]),
          );
        }
      }
    }
  });
});
