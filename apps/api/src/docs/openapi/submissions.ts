import { body, object, op, page, path, query, ref, type Paths } from './common';

export const submissionPaths: Paths = {
  '/api/v1/submissions': {
    post: op('Submissions', 'Submit code for judging', 201, {
      requestBody: body(ref('SubmissionRequest')),
      description: 'Pins the submission to the active testcase set. Returns 409 if no active set exists.',
      responses: { 201: { description: 'Submission queued' }, 409: { description: 'No active testcase set' } },
    }),
    get: op('Submissions', 'List my submissions', 200, { parameters: [...page, query('problemId')] }),
  },
  '/api/v1/submissions/run': {
    post: op('Submissions', 'Run code without saving a submission', 200, { requestBody: body(ref('RunCodeRequest')) }),
  },
  '/api/v1/submissions/{id}': {
    get: op('Submissions', 'Get submission result', 200, {
      parameters: [path('id')],
      description: 'Includes the testcase set version used for judging.',
    }),
  },
};
export const submissionSchemas = {
  SubmissionRequest: object(
    {
      problemId: { type: 'string' },
      code: { type: 'string', minLength: 10 },
      language: { type: 'string', enum: ['cpp', 'java', 'python'] },
      matchId: { type: 'string' },
    },
    ['problemId', 'code', 'language'],
  ),
  RunCodeRequest: object(
    {
      problemId: { type: 'string' },
      code: { type: 'string' },
      language: { type: 'string', enum: ['cpp', 'java', 'python'] },
      customInput: { type: 'string' },
    },
    ['code', 'language'],
  ),
};
