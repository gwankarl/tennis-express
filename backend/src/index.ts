/**
 * Backend process entry point.
 *
 * `app.ts` constructs the Express application without opening a network
 * listener. This module owns the listener so importing the app has no
 * server-startup side effect.
 */
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './shared/logger.js';
import { startPromotionLifecycleScheduler } from './modules/sellers/promotions/services/promotion-lifecycle.scheduler.js';

async function startServer(): Promise<void> {
  await connectDatabase();

  const stopPromotionLifecycleScheduler = startPromotionLifecycleScheduler();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info({ port: env.port }, 'Backend server listening');
  });

  let shutdownStarted = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shutdownStarted) {
      return;
    }

    shutdownStarted = true;
    logger.info({ signal }, 'Shutting down backend');

    try {
      await stopPromotionLifecycleScheduler();
    } catch (error) {
      logger.error({ err: error }, 'Failed to stop the promotion lifecycle scheduler');
      process.exitCode = 1;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to close the HTTP server');
      process.exitCode = 1;
    }

    try {
      await disconnectDatabase();
    } catch (error) {
      logger.error({ err: error }, 'Failed to close the MongoDB connection');
      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

startServer().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to start the backend');
  process.exitCode = 1;
});
