import { body, object, op, path, query, ref, type Paths } from './common';

const base = '/api/v1/problems/{problemId}/testcases';
const problemParam = [path('problemId')];
export const testcasePaths: Paths = {
  '/api/v1/problems/{problemId}/testcase-sets/import': {
    post: op('Testcases', 'Import and activate a versioned testcase ZIP', 201, {
      parameters: problemParam,
      description: 'Administrator only. One multipart archive field containing manifest.json and cases/*.in, cases/*.out. The response contains metadata, never testcase contents.',
      requestBody: { required: true, content: { 'multipart/form-data': { schema: object({ archive: { type: 'string', format: 'binary' } }, ['archive']) } } },
      responses: {
        201: { description: 'Imported and activated', content: { 'application/json': { schema: ref('TestcaseImportResponse') } } },
        400: { description: 'Malformed multipart or manifest' },
        401: { description: 'Authentication required' },
        403: { description: 'Administrator permission required' },
        404: { description: 'Problem not found' },
        409: { description: 'Concurrent import conflict' },
        413: { description: 'Archive resource limit exceeded' },
        422: { description: 'Invalid or unsafe archive' },
      },
    }),
  },
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
  TestcaseImportResponse: object({
    status: { type: 'string', example: 'Success' },
    data: object({
      testcaseSetId: { type: 'string' }, version: { type: 'integer' }, checksum: { type: 'string' },
      testcaseCount: { type: 'integer' }, exampleCount: { type: 'integer' }, active: { type: 'boolean' },
    }, ['testcaseSetId', 'version', 'checksum', 'testcaseCount', 'exampleCount', 'active']),
  }, ['status', 'data']),
  TestcaseRequest: object(
    { input: { type: 'string' }, output: { type: 'string' }, isExample: { type: 'boolean', default: false } },
    ['input', 'output'],
  ),
};
