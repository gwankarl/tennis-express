import type { RequestHandler } from 'express';
import type { z } from 'zod';

/** Validates route parameters and forwards Zod errors to the error handler. */
export function validateParams<TSchema extends z.ZodType>(schema: TSchema): RequestHandler {
  return async (request, _response, next) => {
    const result = await schema.safeParseAsync(request.params);

    if (!result.success) {
      next(result.error);
      return;
    }

    next();
  };
}
