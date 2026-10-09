import { Request, Response, NextFunction } from 'express';
import { submissionService } from './submission.service';
import { executionPreviewService } from './execution-preview.service';
import { AppError } from '../../errors/AppError';

export class SubmissionController {
  async getAdminSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const problemId = typeof req.query.problemId === 'string' ? req.query.problemId : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
      const result = await submissionService.getAdminSubmissions({ problemId, status, page, limit });
      res.status(200).json({ status: 'Success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }
      
      const submission = await submissionService.submit(req.user.userId, req.body);
      res.status(201).json({
        status: 'Success',
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  async runCode(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const results = await executionPreviewService.runCode(req.body);
      res.status(200).json({
        status: 'Success',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionDetails(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const submissionId = req.params.id as string;
      const isAdmin = req.user.role === 'ADMIN';

      const submission = await submissionService.getSubmissionDetails(
        submissionId,
        req.user.userId,
        isAdmin
      );

      res.status(200).json({
        status: 'Success',
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const problemId = req.query.problemId as string | undefined;
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));

      const result = await submissionService.getUserSubmissions(req.user.userId, {
        problemId,
        page,
        limit,
      });

      res.status(200).json({
        status: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const submissionController = new SubmissionController();
