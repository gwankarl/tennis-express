import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError.js';
import { logger } from '../shared/logger.js';

/**
 * Forwards unmatched requests to the centralized error handler as 404 errors.
 */
export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError({
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
      message: 'Route was not found.',
    }),
  );
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

  const appError = error instanceof AppError ? error : undefined;
  const isValidationError = error instanceof ZodError;
  const isPayloadTooLarge = isPayloadTooLargeError(error);
  const isValidAppStatus =
    appError !== undefined && appError.statusCode >= 400 && appError.statusCode <= 599;

  const statusCode = isPayloadTooLarge
    ? 413
    : isValidationError
      ? 400
      : isValidAppStatus
        ? appError.statusCode
        : 500;

  const code = isPayloadTooLarge
    ? 'PAYLOAD_TOO_LARGE'
    : isValidationError
      ? 'REQUEST_VALIDATION_FAILED'
      : appError
        ? appError.code
        : 'INTERNAL_SERVER_ERROR';

  const message = isPayloadTooLarge
    ? 'Request body is too large.'
    : isValidationError
      ? 'Request validation failed.'
      : appError
        ? statusCode >= 500 && process.env.NODE_ENV === 'production'
          ? 'Internal server error.'
          : appError.message
        : process.env.NODE_ENV === 'production'
          ? 'Internal server error.'
          : error instanceof Error
            ? error.message
            : 'Internal server error.';

  const details = isValidationError
    ? error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    : appError?.details;

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
    success: false,
    error: {
      code,
      message,
      ...(details && details.length > 0 && { details }),
    },
  });
};
