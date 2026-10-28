import { PromotionModel } from '../models/promotion.model.js';

export interface PromotionLifecycleRunResult {
  endedCount: number;
  activatedCount: number;
}

/** Applies date-based lifecycle transitions to seller discounts and admin campaigns. */
export class PromotionLifecycleService {
  /**
   * Ends expired promotions and activates scheduled promotions whose start time has arrived.
   * Run this method periodically from the backend process after MongoDB connects.
   */
  async processDuePromotions(now: Date = new Date()): Promise<PromotionLifecycleRunResult> {
    // End expired scheduled promotions directly as well as promotions that were active.
    const endedResult = await PromotionModel.updateMany(
      {
        status: { $in: ['scheduled', 'active'] },
        endsAt: { $lte: now },
      },
      {
        $set: { status: 'ended' },
      },
    ).exec();

    // Only activate promotions whose end time has not already passed.
    const activatedResult = await PromotionModel.updateMany(
      {
        status: 'scheduled',
        startsAt: { $lte: now },
        endsAt: { $gt: now },
      },
      {
        $set: { status: 'active' },
      },
    ).exec();

    return {
      endedCount: endedResult.modifiedCount,
      activatedCount: activatedResult.modifiedCount,
    };
  }
}
