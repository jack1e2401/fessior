import { authPaths } from './auth';
import { matchPaths } from './matches';
import { problemPaths, problemSchemas } from './problems';
import { submissionPaths, submissionSchemas } from './submissions';
import { testcasePaths, testcaseSchemas } from './testcases';
import { userPaths, userSchemas } from './users';
import { object } from './common';

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Fessior API',
    version: '1.0.0',
    description: 'HTTP API for authentication, problems, versioned testcases, submissions, and matches.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth', description: 'Accounts and sessions' },
    { name: 'Users', description: 'Profiles and administration' },
    { name: 'Problems', description: 'Problem catalog and administration' },
    { name: 'Testcases', description: 'Active testcase sets' },
    { name: 'Submissions', description: 'Code execution and judging' },
    { name: 'Matches', description: 'Match history and details' },
  ],
  paths: { ...authPaths, ...userPaths, ...problemPaths, ...testcasePaths, ...submissionPaths, ...matchPaths },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      SuccessResponse: object({
        status: { type: 'string', example: 'Success' },
        message: { type: 'string' },
        data: { description: 'Endpoint-specific response data' },
      }),
      ErrorResponse: object({ status: { type: 'string', example: 'Error' }, message: { type: 'string' } }),
      RegisterRequest: object(
        {
          username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
          email: { type: 'string', format: 'email' },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 100,
            format: 'password',
            description: 'Uppercase, lowercase, digit, and special character required.',
          },
        },
        ['username', 'email', 'password'],
      ),
      LoginRequest: object(
        { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } },
        ['email', 'password'],
      ),
      ...userSchemas,
      ...problemSchemas,
      ...testcaseSchemas,
      ...submissionSchemas,
    },
  },
};
