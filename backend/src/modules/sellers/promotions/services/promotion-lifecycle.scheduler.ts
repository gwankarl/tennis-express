import { logger } from '../../../../shared/logger.js';
import { PromotionLifecycleService } from './promotion-lifecycle.service.js';

const POLL_INTERVAL_MS = 60_000;

const promotionLifecycleService = new PromotionLifecycleService();

/** Starts periodic promotion lifecycle updates and returns an async stop function. */
export function startPromotionLifecycleScheduler(): () => Promise<void> {
  let currentRun: Promise<void> | undefined;

  const runOnce = (): Promise<void> => {
    if (currentRun) {
      return currentRun;
    }

    currentRun = (async () => {
      try {
        const result = await promotionLifecycleService.processDuePromotions();

        if (result.endedCount > 0 || result.activatedCount > 0) {
          logger.info(result, 'Promotion lifecycle transitions completed');
        }
      } catch (error) {
        logger.error({ err: error }, 'Promotion lifecycle job failed');
      } finally {
        currentRun = undefined;
      }
    })();

    return currentRun;
  };

  // Process promotions that are already due before starting the polling interval.
  void runOnce();

  const interval = setInterval(() => {
    void runOnce();
  }, POLL_INTERVAL_MS);

  // The HTTP server should keep the process alive; this timer need not do so by itself.
  interval.unref();

  return async () => {
    clearInterval(interval);

    if (currentRun) {
      await currentRun;
    }
  };
}
