import { Router } from 'express';
import * as authController from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import { requireAuth } from './auth.middleware';

const router = Router();

router.post(
	'/register',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'Register new user'
		 #swagger.description = 'Create a new user account with email and password. Returns created user object (without password).'
		 #swagger.requestBody = {
			 required: true,
			 content: {
				 'application/json': {
					 schema: {
						 type: 'object',
						 properties: {
							 name: { type: 'string', description: 'Full name of the user' },
							 username: { type: 'string', description: 'Unique username (optional)' },
							 email: { type: 'string', format: 'email' },
							 password: { type: 'string', description: 'Plain text password (min length depends on validator)' }
						 },
						 required: ['email','password']
					 },
					 example: { name: 'Jane Doe', username: 'janedoe', email: 'jane@example.com', password: 's3cretPass' }
				 }
			 }
		 }
		 #swagger.responses[201] = {
			 description: 'User created successfully',
			 content: {
				 'application/json': {
					 schema: {
						 type: 'object',
						 properties: {
							 status: { type: 'string' },
							 message: { type: 'string' },
							 data: {
								 type: 'object',
								 properties: {
									 id: { type: 'string' },
									 name: { type: 'string' },
									 username: { type: 'string' },
									 email: { type: 'string' },
									 createdAt: { type: 'string', format: 'date-time' }
								 }
							 }
						 }
					 },
					 example: { status: 'Success', message: 'User registered successfully', data: { id: 'user_123', name: 'Jane Doe', username: 'janedoe', email: 'jane@example.com', createdAt: '2026-06-12T12:00:00Z' } }
				 }
			 }
		 }
	*/
	validateRequest(registerSchema),
	authController.register
);

router.post(
	'/login',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'User login'
		 #swagger.description = 'Authenticate with email (or username) and password. Returns access and refresh tokens.'
		 #swagger.requestBody = {
			 required: true,
			 content: {
				 'application/json': {
					 schema: {
						 type: 'object',
						 properties: {
							 email: { type: 'string', description: 'Email or username' },
							 password: { type: 'string' }
						 },
						 required: ['email','password']
					 },
					 example: { email: 'jane@example.com', password: 's3cretPass' }
				 }
			 }
		 }
		 #swagger.responses[200] = {
			 description: 'Authentication successful',
			 content: {
				 'application/json': {
					 schema: {
						 type: 'object',
						 properties: {
							 status: { type: 'string' },
							 message: { type: 'string' },
							 data: { type: 'object', properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' }, expiresIn: { type: 'number' } } }
						 }
					 },
					 example: { status: 'Success', message: 'Login successful', data: { accessToken: 'eyJ...', refreshToken: 'rftkn...', expiresIn: 3600 } }
				 }
			 }
		 }
	*/
	validateRequest(loginSchema),
	authController.login
);

router.post(
	'/logout',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'Logout (revoke refresh token)'
		 #swagger.description = 'Invalidate a refresh token to log out a session. Requires Authorization header.'
		 #swagger.security = [{ "bearerAuth": [] }]
		 #swagger.requestBody = {
			 required: true,
			 content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] }, example: { refreshToken: 'rftkn...' } } }
		 }
		 #swagger.responses[200] = { description: 'Logged out successfully', content: { 'application/json': { example: { status: 'Success', message: 'Logged out successfully' } } } }
	*/
	requireAuth,
	validateRequest(refreshTokenSchema),
	authController.logout
);

router.post(
	'/refresh',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'Refresh access token'
		 #swagger.description = 'Exchange a valid refresh token for a new access token.'
		 #swagger.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] }, example: { refreshToken: 'rftkn...' } } } }
		 #swagger.responses[200] = { description: 'New access token', content: { 'application/json': { example: { status: 'Success', message: 'Token refreshed successfully', data: { accessToken: 'eyJ...', expiresIn: 3600 } } } } }
	*/
	validateRequest(refreshTokenSchema),
	authController.refresh
);

router.get(
	'/me',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'Get current user profile'
		 #swagger.description = 'Return the profile of the currently authenticated user.'
		 #swagger.security = [{ "bearerAuth": [] }]
		 #swagger.responses[200] = {
			 description: 'User profile returned',
			 content: {
				 'application/json': {
					 schema: {
						 type: 'object',
						 properties: {
							 status: { type: 'string' },
							 message: { type: 'string' },
							 data: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, username: { type: 'string' }, email: { type: 'string' } } }
						 }
					 },
					 example: { status: 'Success', message: 'User fetched successfully', data: { id: 'user_123', name: 'Jane Doe', username: 'janedoe', email: 'jane@example.com' } }
				 }
			 }
		 }
	*/
	requireAuth,
	authController.getMe
);

router.delete(
	'/sessions/:sessionId',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'Revoke a specific session'
		 #swagger.description = 'Revoke a previously issued session (by sessionId). Requires Authorization header.'
		 #swagger.security = [{ "bearerAuth": [] }]
		 #swagger.parameters['sessionId'] = { in: 'path', description: 'ID of the session to revoke', required: true, schema: { type: 'string' } }
		 #swagger.responses[200] = { description: 'Session revoked', content: { 'application/json': { example: { status: 'Success', message: 'Session revoked successfully' } } } }
	*/
	requireAuth,
	authController.revokeSession
);

router.delete(
	'/sessions',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'Revoke all sessions for current user'
		 #swagger.description = 'Invalidate all refresh tokens / sessions for the authenticated user.'
		 #swagger.security = [{ "bearerAuth": [] }]
		 #swagger.responses[200] = { description: 'All sessions revoked', content: { 'application/json': { example: { status: 'Success', message: 'All sessions revoked successfully' } } } }
	*/
	requireAuth,
	authController.revokeAllSessions
);

router.get(
	'/sessions',
	/* #swagger.tags = ['Auth']
		 #swagger.summary = 'List active sessions for current user'
		 #swagger.description = 'Return a list of active sessions (id, ip, userAgent, createdAt, lastActive). Requires Authorization header.'
		 #swagger.security = [{ "bearerAuth": [] }]
		 #swagger.responses[200] = { description: 'Sessions retrieved', content: { 'application/json': { example: { status: 'Success', message: 'Sessions retrieved successfully', data: [ { id: 'sess_1', ip: '127.0.0.1', userAgent: 'Mozilla/5.0', createdAt: '2026-06-12T12:00:00Z', lastActive: '2026-06-12T12:00:00Z' } ] } } } }
	*/
	requireAuth,
	authController.getUserSessions
);

export default router;
