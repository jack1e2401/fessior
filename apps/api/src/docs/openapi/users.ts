import { body, object, op, page, path, query, ref, type Paths } from './common';

const publicUser = (summary: string, parameters: Record<string, unknown>[] = [path('username')]) =>
  op('Users', summary, 200, { security: [], parameters });
const admin = (summary: string, parameters: Record<string, unknown>[] = [path('id')]) =>
  op('Users', summary, 200, { parameters, description: 'Administrator only.' });
export const userPaths: Paths = {
  '/api/v1/users/profile/{username}': { get: publicUser('Get public profile') },
  '/api/v1/users/{username}/submissions': {
    get: publicUser('Get public accepted submissions', [path('username'), ...page]),
  },
  '/api/v1/users': { get: admin('List users', [...page, query('search')]) },
  '/api/v1/users/me': {
    get: op('Users', 'Get my profile'),
    patch: { ...op('Users', 'Update my profile'), requestBody: body(ref('UpdateMeRequest')) },
  },
  '/api/v1/users/me/submissions': { get: op('Users', 'Get my submissions', 200, { parameters: page }) },
  '/api/v1/users/me/elo-history': { get: op('Users', 'Get my Elo history', 200, { parameters: page }) },
  '/api/v1/users/me/streak': { get: op('Users', 'Get my activity streak') },
  '/api/v1/users/{id}': {
    get: admin('Get user by ID'),
    patch: { ...admin('Update user'), requestBody: body(ref('AdminUpdateUserRequest')) },
  },
  '/api/v1/users/{id}/role': {
    patch: {
      ...admin('Change user role'),
      requestBody: body(object({ role: { type: 'string', enum: ['USER', 'ADMIN'] } }, ['role'])),
    },
  },
  '/api/v1/users/{id}/ban': {
    post: { ...admin('Ban user'), requestBody: body(object({ reason: { type: 'string', maxLength: 255 } })) },
  },
  '/api/v1/users/{id}/unban': { post: admin('Unban user') },
  '/api/v1/users/profile/{username}/elo-history': {
    get: publicUser('Get public Elo history', [path('username'), ...page]),
  },
  '/api/v1/users/profile/{username}/streak': { get: publicUser('Get public activity streak') },
};
export const userSchemas = {
  UpdateMeRequest: object({
    full_name: { type: 'string', minLength: 1, maxLength: 100 },
    bio: { type: 'string', maxLength: 500 },
    avatar_url: { type: 'string', format: 'uri', nullable: true },
  }),
  AdminUpdateUserRequest: object({
    username: { type: 'string', minLength: 3, maxLength: 50 },
    email: { type: 'string', format: 'email' },
    full_name: { type: 'string', minLength: 1, maxLength: 100 },
    bio: { type: 'string', maxLength: 500 },
    elo_rating: { type: 'integer', minimum: 0, maximum: 3000 },
    code_coins: { type: 'integer', minimum: 0 },
  }),
};
