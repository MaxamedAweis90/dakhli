import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  fieldErrors?: Record<string, string>;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isMongooseValidation = err.name === 'ValidationError' && err.errors;
  const statusCode = err.statusCode || (isMongooseValidation ? 400 : 500);

  let message = err.message || 'An unexpected internal server error occurred.';
  let fieldErrors: Record<string, string> | undefined = err.fieldErrors;

  if (isMongooseValidation) {
    fieldErrors = {};
    for (const [key, val] of Object.entries(err.errors!)) {
      fieldErrors[key] = val.message;
    }
    const firstMessage = Object.values(fieldErrors)[0];
    if (firstMessage) {
      message = firstMessage;
    }
  }

  const response: {
    success: false;
    error: {
      message: string;
      code?: string;
      fieldErrors?: Record<string, string>;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      message,
      ...(err.code ? { code: err.code } : {}),
      ...(fieldErrors && Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    },
  };

  if (ENV.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
