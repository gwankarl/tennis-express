import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '../shared/logger.js';

/**
 * Assigns each request an ID and logs its completion with structured fields.
 * The response header lets clients share the ID when reporting a problem.
 */
export const requestLogger: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  response.setHeader('X-Request-Id', requestId);

  response.on('finish', () => {
    const logData = {
      requestId,
      method: request.method,
      url: request.originalUrl,
      statusCode: response.statusCode,
      responseTimeMs: Date.now() - startedAt,
    };

    if (response.statusCode >= 500) {
      logger.error(logData, 'HTTP request completed with a server error');
    } else if (response.statusCode >= 400) {
      logger.warn(logData, 'HTTP request completed with a client error');
    } else {
      logger.info(logData, 'HTTP request completed');
    }
  });

  next();
};
