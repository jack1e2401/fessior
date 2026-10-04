import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import './config/env';
import { prisma } from './config/prisma';
import authRoutes from './modules/auth/auth.route';
import problemRoutes from './modules/problems/problem.route';
import testcaseRoutes from './modules/testcases/testcase.route';
import submissionRoutes from './modules/submissions/submission.route';
import matchRoutes from './modules/matches/match.route';
import userRoutes from './modules/users/user.route';
import swaggerUi from 'swagger-ui-express';
import { openapiDocument } from './docs/openapi';
import { errorMiddleware } from './middlewares/error.middleware';
import { API_ROUTES } from '@ocj/contracts';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use(`/api/v1${API_ROUTES.AUTH}`, authRoutes);
app.use(`/api/v1${API_ROUTES.USER}`, userRoutes);
app.use(`/api/v1${API_ROUTES.PROBLEMS}/:problemId/testcases`, testcaseRoutes);
app.use(`/api/v1${API_ROUTES.PROBLEMS}/testcases`, testcaseRoutes);
app.use(`/api/v1${API_ROUTES.PROBLEMS}`, problemRoutes);
app.use(`/api/v1${API_ROUTES.SUBMISSIONS}`, submissionRoutes);
app.use(`/api/v1${API_ROUTES.MATCHES}`, matchRoutes);

app.get('/', async (req, res) => {
  const userCount = await prisma.user.count();
  return res.status(200).json({
    status: "Success",
    message: "Welcome x 3.14",
    userCount
  })
});

// Global error handler middleware should be at the end of route declarations
app.use(errorMiddleware);

export default app;
