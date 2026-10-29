import mongoose, { type PipelineStage } from 'mongoose';

import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationQuery,
} from '../../../../shared/pagination.js';
import { ProductModel } from '../../../sellers/products/management/models/product.model.js';
import { mapPublicProductCards } from '../../../products/helpers/public-product-card.mapper.js';
import { buildPublicProductVisibilityStages } from '../../../products/helpers/public-product-visibility.stages.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { PublicProductService } from '../../../products/services/public-product.service.js';
import { WishlistItemModel } from '../models/wishlist-item.model.js';
import type {
  WishlistListResult,
  AddWishlistItemResult,
  WishlistStatusResult,
} from '../types/wishlist.types.js';
import { logger } from '../../../../shared/logger.js';
import { ProductEngagementService } from '../../../products/services/product-engagement.service.js';

type PublicProductAggregateRow = Parameters<typeof mapPublicProductCards>[0][number];

const publicProductService = new PublicProductService();
const productEngagementService = new ProductEngagementService();

/** Reads wishlist entries and attaches product cards only for public listings. */
export class WishlistService {
  /** Returns a paginated wishlist for one authenticated account. */
  async getMyWishlist(userId: string, query: PaginationQuery): Promise<WishlistListResult> {
    const ownerId = new mongoose.Types.ObjectId(userId);

    const [wishlistItems, totalItems] = await Promise.all([
      WishlistItemModel.find({ userId: ownerId })
        .sort({ addedAt: -1, _id: -1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .lean()
        .exec(),
      WishlistItemModel.countDocuments({ userId: ownerId }).exec(),
    ]);

    const productIds = wishlistItems.map((item) => item.productId);
    let productCards: ReturnType<typeof mapPublicProductCards> = [];

    if (productIds.length > 0) {
      const pipeline: PipelineStage[] = [
        ...buildPublicProductVisibilityStages({ _id: { $in: productIds } }),
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            condition: 1,
            images: 1,
            eligibleStore: 1,
            variantSummary: 1,
          },
        },
      ];

      const products = await ProductModel.aggregate<PublicProductAggregateRow>(pipeline).exec();
      productCards = mapPublicProductCards(products);
    }

    const cardsById = new Map(productCards.map((card) => [card.id, card]));

    return {
      items: wishlistItems.map((item) => {
        const productId = item.productId.toString();

        return {
          productId,
          addedAt: item.addedAt,
          product: cardsById.get(productId) ?? null,
        };
      }),
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }

  /** Saves a publicly visible product for the authenticated user. */
  async addItem(userId: string, productId: string): Promise<AddWishlistItemResult> {
    // A hidden or missing product is returned as PRODUCT_NOT_FOUND by this service.
    await publicProductService.getById(productId);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const filter = { userId: userObjectId, productId: productObjectId };

    const existingItem = await WishlistItemModel.findOne(filter).lean().exec();

    if (existingItem) {
      return {
        item: {
          productId: existingItem.productId.toString(),
          addedAt: existingItem.addedAt,
        },
        created: false,
      };
    }

    try {
      const createdItem = await WishlistItemModel.create(filter);

      try {
        await productEngagementService.recordWishlistAdd(productId, userId);
      } catch (error) {
        // Analytics failures should not undo a successful wishlist addition.
        logger.warn({ err: error, productId, userId }, 'Could not record wishlist-add event.');
      }

      return {
        item: {
          productId: createdItem.productId.toString(),
          addedAt: createdItem.addedAt,
        },
        created: true,
      };
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }

      // The unique index can catch two simultaneous requests after both checks.
      const itemAfterConflict = await WishlistItemModel.findOne(filter).lean().exec();

      if (!itemAfterConflict) {
        throw error;
      }

      return {
        item: {
          productId: itemAfterConflict.productId.toString(),
          addedAt: itemAfterConflict.addedAt,
        },
        created: false,
      };
    }
  }

  /** Checks whether a product is saved by the authenticated user. */
  async getItemStatus(userId: string, productId: string): Promise<WishlistStatusResult> {
    const wishlistItem = await WishlistItemModel.exists({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    }).exec();

    return {
      isWishlisted: wishlistItem !== null,
    };
  }
  /** Removes one wishlist item owned by the authenticated user. */
  async removeItem(userId: string, productId: string): Promise<void> {
    const result = await WishlistItemModel.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new AppError({
        statusCode: 404,
        code: 'WISHLIST_ITEM_NOT_FOUND',
        message: 'The wishlist item could not be found.',
      });
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
