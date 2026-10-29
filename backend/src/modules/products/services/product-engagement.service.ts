import mongoose from 'mongoose';

import { ProductEngagementEventModel } from '../models/product-engagement.model.js';

const EVENT_RETENTION_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Records product engagement events used by public product collections. */
export class ProductEngagementService {
  /** Records at most one view per product and actor per UTC day. */
  async recordView(productId: string, actorKey: string, now = new Date()): Promise<void> {
    const viewDay = now.toISOString().slice(0, 10);

    try {
      await ProductEngagementEventModel.updateOne(
        {
          productId: new mongoose.Types.ObjectId(productId),
          eventType: 'view',
          actorKey,
          viewDay,
        },
        {
          $setOnInsert: {
            occurredAt: now,
            expiresAt: new Date(now.getTime() + EVENT_RETENTION_DAYS * MILLISECONDS_PER_DAY),
          },
        },
        { upsert: true },
      ).exec();
    } catch (error) {
      // Concurrent requests can race to create the same unique daily view.
      if (this.isDuplicateKeyError(error)) {
        return;
      }

      throw error;
    }
  }

  /** Records a successful wishlist addition for popularity aggregation. */
  async recordWishlistAdd(productId: string, userId: string, now = new Date()): Promise<void> {
    await ProductEngagementEventModel.create({
      productId: new mongoose.Types.ObjectId(productId),
      eventType: 'wishlist_add',
      actorKey: `user:${userId}`,
      occurredAt: now,
      expiresAt: new Date(now.getTime() + EVENT_RETENTION_DAYS * MILLISECONDS_PER_DAY),
    });
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
