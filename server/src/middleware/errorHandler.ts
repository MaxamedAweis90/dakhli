import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const message = err.message || 'An unexpected internal server error occurred.';

  const response: {
    success: false;
    error: {
      message: string;
      code?: string;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      message,
      ...(err.code ? { code: err.code } : {}),
    },
  };

  if (ENV.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
