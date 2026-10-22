import type { RequestHandler } from 'express';
import type { z } from 'zod';

/**
 * Validates a JSON request body and replaces it with the parsed output.
 * Invalid bodies are forwarded to the centralized error handler.
 */
export function validateBody<TSchema extends z.ZodType>(schema: TSchema): RequestHandler {
  return async (request, _response, next) => {
    const result = await schema.safeParseAsync(request.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    request.body = result.data;
    next();
  };
}
