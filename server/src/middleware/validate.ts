import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';

export interface ValidationSchemas {
  body?: ZodType<unknown>;
  query?: ZodType<unknown>;
  params?: ZodType<unknown>;
}

/**
 * Express middleware that validates req.body, req.query, and/or req.params against Zod schemas.
 * In case of failure, returns a 400 Bad Request with a structured fieldErrors dictionary.
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fieldErrors: Record<string, string> = {};

      if (schemas.params) {
        const paramResult = schemas.params.safeParse(req.params);
        if (!paramResult.success) {
          collectZodErrors(paramResult.error, fieldErrors);
        } else {
          req.params = paramResult.data as Record<string, string>;
        }
      }

      if (schemas.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          collectZodErrors(queryResult.error, fieldErrors);
        } else {
          req.query = queryResult.data as Record<string, any>;
        }
      }

      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          collectZodErrors(bodyResult.error, fieldErrors);
        } else {
          req.body = bodyResult.data;
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        const firstMessage = Object.values(fieldErrors)[0] || 'Validation error.';
        res.status(400).json({
          success: false,
          error: {
            message: firstMessage,
            code: 'VALIDATION_ERROR',
            fieldErrors,
          },
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

function collectZodErrors(error: ZodError, target: Record<string, string>): void {
  for (const issue of error.issues) {
    const fieldPath = issue.path.length > 0 ? issue.path.join('.') : 'general';
    // Keep first error message for each field path
    if (!target[fieldPath]) {
      target[fieldPath] = issue.message;
    }
  }
}

