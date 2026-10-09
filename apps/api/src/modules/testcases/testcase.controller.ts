import { Request, Response, NextFunction } from 'express';
import { testcaseService } from './testcase.service';
import { withUploadedArchive } from './ingestion/archive-upload';

export class TestcaseController {
  async listTestcaseSets(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
      const result = await testcaseService.listTestcaseSetSummaries(req.params.problemId as string, page, limit);
      res.status(200).json({ status: 'Success', data: result });
    } catch (error) { next(error); }
  }

  async importArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await withUploadedArchive(req, (path, checksum) =>
        testcaseService.importArchive(req.params.problemId as string, path, checksum));
      res.status(201).json({ status: 'Success', data: result });
    } catch (error) { next(error); }
  }

  async activateTestcaseSet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await testcaseService.activateTestcaseSet(
        req.params.problemId as string,
        req.params.testcaseSetId as string,
      );
      res.status(200).json({ status: 'Success', data: result });
    } catch (error) { next(error); }
  }
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
      const isExampleOnly = req.user.role !== 'ADMIN' || req.query.example === 'true';
      const testcases = await testcaseService.getTestcases(problemId, isExampleOnly);
      res.status(200).json({ status: 'Success', data: testcases });
    } catch (error) {
      next(error);
    }
  }

  async deleteTestcase(req: Request, res: Response, next: NextFunction) {
    try {
      const testcaseId = req.params.testcaseId as string;
      const problemId = req.params.problemId as string;
      await testcaseService.deleteTestcase(problemId, testcaseId);
      res.status(200).json({ status: 'Success', message: 'Testcase deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const testcaseController = new TestcaseController();
