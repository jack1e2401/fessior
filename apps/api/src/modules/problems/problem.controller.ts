import { Request, Response, NextFunction } from 'express';
import { problemService } from './problem.service';
import { Difficulty } from '@prisma/client';

export class ProblemController {
  async createProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const problem = await problemService.createProblem(req.body);
      res.status(201).json({
        status: 'Success',
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const problem = await problemService.updateProblem(id, req.body);
      res.status(200).json({
        status: 'Success',
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await problemService.deleteProblem(id);
      res.status(200).json({
        status: 'Success',
        message: 'Problem deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;
      const problem = await problemService.getProblemBySlug(slug);
      res.status(200).json({
        status: 'Success',
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async listProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
      const difficulty = req.query.difficulty as Difficulty | undefined;
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));

      const result = await problemService.getProblemsList({
        difficulty,
        search,
        page,
        limit,
        userId,
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

export const problemController = new ProblemController();
