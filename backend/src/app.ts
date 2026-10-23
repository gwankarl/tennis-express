import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { createV1Router } from './routes/v1/index.js';

/**
 * Builds the Express application without starting a network listener.
 * This keeps app setup separate from server startup.
 */
export function createApp(): Express {
  const app = express();

  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.get('/api/v1/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1', createV1Router());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
