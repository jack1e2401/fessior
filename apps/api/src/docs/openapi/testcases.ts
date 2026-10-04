import { body, object, op, path, query, ref, type Paths } from './common';

const base = '/api/v1/problems/{problemId}/testcases';
const problemParam = [path('problemId')];
export const testcasePaths: Paths = {
  [base]: {
    get: op('Testcases', 'List active testcases', 200, {
      parameters: [...problemParam, query('example', 'boolean')],
      description:
        'Returns testcases from the active version. Hidden input and output are visible only to administrators. Set example=true to filter examples.',
    }),
    post: op('Testcases', 'Create testcase and activate a new set version', 201, {
      parameters: problemParam,
      requestBody: body(ref('TestcaseRequest')),
      description: 'Administrator only. Existing submissions remain pinned to their original set.',
    }),
  },
  [`${base}/{testcaseId}`]: {
    delete: op('Testcases', 'Remove testcase and activate a new set version', 200, {
      parameters: [...problemParam, path('testcaseId')],
      description: 'Administrator only. Previous set versions remain available for judging older submissions.',
    }),
  },
};
export const testcaseSchemas = {
  TestcaseRequest: object(
    { input: { type: 'string' }, output: { type: 'string' }, isExample: { type: 'boolean', default: false } },
    ['input', 'output'],
  ),
};
