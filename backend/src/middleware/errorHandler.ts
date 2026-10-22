import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../shared/logger.js';

/**
 * An expected HTTP error with a status and client-safe message.
 * Use it for errors that should be returned to the client, such as a missing route.
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Forwards unmatched requests to the centralized error handler as 404 errors.
 */
export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, `Route ${request.method} ${request.originalUrl} was not found`));
};

/**
 * Identifies requests rejected by Express's body parser for exceeding its size limit.
 */
function isPayloadTooLargeError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  );
}

/**
 * Logs server errors and returns a consistent JSON error response.
 * Hides unexpected error details in production.
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const isValidationError = error instanceof ZodError;
  const isHttpError = error instanceof HttpError;
  const isPayloadTooLarge = isPayloadTooLargeError(error);

  const statusCode = isPayloadTooLarge
    ? 413
    : isValidationError
      ? 400
      : isHttpError && error.statusCode >= 400 && error.statusCode <= 599
        ? error.statusCode
        : 500;

  const message = isPayloadTooLarge
    ? 'Request body is too large'
    : isValidationError
      ? 'Request validation failed'
      : isHttpError
        ? error.message
        : process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error instanceof Error
            ? error.message
            : 'Internal server error';

  if (statusCode >= 500) {
    logger.error(
      {
        err: error,
        requestId: response.getHeader('X-Request-Id'),
      },
      'Request failed',
    );
  }

  response.status(statusCode).json({
    error: {
      message,
      ...(isValidationError && {
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    },
  });
};
