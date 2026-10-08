import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed: any = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.query !== undefined) {
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      if (parsed.params !== undefined) {
        Object.defineProperty(req, 'params', {
          value: parsed.params,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      next();
    } catch (error: any) {
      if (
        error instanceof ZodError ||
        error?.name === 'ZodError' ||
        Array.isArray(error?.issues)
      ) {
        const issues = error.issues || error.errors || [];
        const formattedErrors = issues.map((err: any) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : String(err.path),
          message: err.message,
        }));
        sendError(res, 'Validation failed', 400, formattedErrors);
        return;
      }
      console.error('Validation unexpected error:', error);
      sendError(res, 'Invalid request data', 400);
    }
  };
