import type { RequestHandler } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';
import type { z } from 'zod';

/**
 * Stores the validated query output in Express response locals.
 */
export type ValidatedQueryLocals<TQuery> = {
  validatedQuery: TQuery;
};

/**
 * Validates query parameters and stores the parsed values in response locals.
 * Invalid queries are forwarded to the centralized error handler.
 */
export function validateQuery<TSchema extends z.ZodType>(
  schema: TSchema,
): RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  Query,
  ValidatedQueryLocals<z.output<TSchema>>
> {
  return async (request, response, next) => {
    const result = await schema.safeParseAsync(request.query);

    if (!result.success) {
      next(result.error);
      return;
    }

    response.locals.validatedQuery = result.data;
    next();
  };
}
