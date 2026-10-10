import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If the error is an instance of AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'Error',
      message: err.message,
      ...(err.importFailure ? { error: err.importFailure } : {}),
    });
    return;
  }

  // Handle other unexpected errors (e.g. database errors, syntax errors)
  console.error('Unhandled Error:', err);

  res.status(500).json({
    status: 'Error',
    message: env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
};
