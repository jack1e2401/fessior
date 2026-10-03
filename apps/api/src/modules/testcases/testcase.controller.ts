import { Request, Response, NextFunction } from 'express';
import { testcaseService } from './testcase.service';

export class TestcaseController {
  async addTestcase(req: Request, res: Response, next: NextFunction) {
    try {
      const problemId = req.params.problemId as string;
      const { isExample, input, output } = req.body;
      const testcase = await testcaseService.addTestcase(problemId, isExample, input, output);
      res.status(201).json({ status: 'Success', data: testcase });
    } catch (error) {
      next(error);
    }
  }

  async getTestcases(req: Request, res: Response, next: NextFunction) {
    try {
      const problemId = req.params.problemId as string;
      const isExampleOnly = req.query.example === 'true';
      const testcases = await testcaseService.getTestcases(problemId, isExampleOnly);
      res.status(200).json({ status: 'Success', data: testcases });
    } catch (error) {
      next(error);
    }
  }

  async deleteTestcase(req: Request, res: Response, next: NextFunction) {
    try {
      const testcaseId = req.params.testcaseId as string;
      await testcaseService.deleteTestcase(testcaseId);
      res.status(200).json({ status: 'Success', message: 'Testcase deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const testcaseController = new TestcaseController();
