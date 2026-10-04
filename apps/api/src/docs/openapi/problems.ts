import { body, object, op, page, path, query, ref, type Paths } from './common';

const admin = (summary: string, status = 200) =>
  op('Problems', summary, status, { description: 'Administrator only.' });
export const problemPaths: Paths = {
  '/api/v1/problems': {
    get: op('Problems', 'List problems', 200, {
      security: [],
      parameters: [...page, query('difficulty')],
    }),
    post: { ...admin('Create problem', 201), requestBody: body(ref('ProblemRequest')) },
  },
  '/api/v1/problems/{problem}': {
    get: op('Problems', 'Get problem by slug', 200, {
      security: [],
      parameters: [{ ...path('problem'), description: 'Problem slug' }],
    }),
    put: {
      ...admin('Update problem'),
      parameters: [{ ...path('problem'), description: 'Problem ID' }],
      requestBody: body(ref('ProblemUpdateRequest')),
    },
    delete: { ...admin('Delete problem'), parameters: [{ ...path('problem'), description: 'Problem ID' }] },
  },
};
const problemProperties = {
  title: { type: 'string', minLength: 3, maxLength: 255 },
  description: { type: 'string', minLength: 10 },
  difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
  timeLimit: { type: 'integer', minimum: 100, maximum: 10000, default: 2000 },
  memoryLimit: { type: 'integer', minimum: 16, maximum: 1024, default: 256 },
  starterCodes: object({ cpp: { type: 'string' }, java: { type: 'string' }, python: { type: 'string' } }),
  editorialMarkdown: { type: 'string' },
  editorialVideoUrl: { type: 'string', format: 'uri' },
};
export const problemSchemas = {
  ProblemRequest: object(problemProperties, ['title', 'description', 'difficulty']),
  ProblemUpdateRequest: object(problemProperties),
};
