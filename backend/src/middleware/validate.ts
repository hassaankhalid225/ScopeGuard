import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

/** Validates `req[source]` against a Zod schema and replaces it with parsed data. */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // query/params are read-only getters on some Express versions; assign safely
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw AppError.badRequest('Validation failed', err.flatten());
      }
      throw err;
    }
  };
}
