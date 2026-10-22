import express, { type Express } from 'express';

/**
 * Builds the Express application without starting a network listener.
 * This keeps app setup separate from server startup.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/api/v1/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  return app;
}
