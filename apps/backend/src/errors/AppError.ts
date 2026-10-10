import type { TestcaseImportFailure } from '@ocj/contracts';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public importFailure?: TestcaseImportFailure;

  constructor(message: string, statusCode: number, importFailure?: TestcaseImportFailure) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.importFailure = importFailure;
  }
}
