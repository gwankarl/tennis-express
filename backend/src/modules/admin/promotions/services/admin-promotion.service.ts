import mongoose, { type QueryFilter } from 'mongoose';

import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
} from '../../../../shared/pagination.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { PromotionModel } from '../../../sellers/promotions/models/promotion.model.js';
import type { Promotion } from '../../../sellers/promotions/types/promotion.types.js';
import type {
  AdminPromotionListQuery,
  CreateAdminMarketplaceCampaignRequest,
  UpdateAdminMarketplaceCampaignRequest,
} from '../schemas/admin-promotion.schema.js';

import { validateMarketplaceCampaignProducts } from '../helpers/admin-promotion-product-eligibility.helper.js';

export interface AdminPromotionListResult {
  promotions: Promotion[];
  pagination: PaginationMetadata;
}

/** Provides administrator operations for seller discounts and marketplace campaigns. */
export class AdminPromotionService {
  /** Lists promotions using optional filters and pagination. */
  async list(input: AdminPromotionListQuery): Promise<AdminPromotionListResult> {
    const filter: QueryFilter<Promotion> = {};

    if (input.type !== undefined) {
      filter.type = input.type;
    }

    if (input.status !== undefined) {
      filter.status = input.status;
    }

    const [documents, totalItems] = await Promise.all([
      PromotionModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(getPaginationOffset(input))
        .limit(input.limit)
        .exec(),
      PromotionModel.countDocuments(filter).exec(),
    ]);

    return {
      promotions: documents.map((document) => document.toObject() as Promotion),
      pagination: buildPaginationMetadata(input, totalItems),
    };
  }

  /** Retrieves one promotion for administrator review. */
  async getById(promotionId: string): Promise<Promotion> {
    if (!mongoose.isValidObjectId(promotionId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PROMOTION_ID',
        message: 'A valid promotion ID is required.',
      });
    }

    const promotion = await PromotionModel.findById(promotionId).exec();

    if (!promotion) {
      throw new AppError({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
        message: 'The promotion does not exist.',
      });
    }

    return promotion.toObject() as Promotion;
  }

  /** Creates a marketplace campaign as the authenticated administrator. */
  async createMarketplaceCampaign(
    adminId: string,
    input: CreateAdminMarketplaceCampaignRequest,
  ): Promise<Promotion> {
    if (!mongoose.isValidObjectId(adminId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_ADMIN_ID',
        message: 'A valid administrator ID is required.',
      });
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const now = new Date();

    if (endsAt <= now) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_END_TIME_PASSED',
        message: 'The campaign end time must be in the future.',
      });
    }

    const eligibleProductIds = input.eligibleProductIds.map(
      (productId) => new mongoose.Types.ObjectId(productId),
    );

    await validateMarketplaceCampaignProducts(eligibleProductIds);

    const campaign = await PromotionModel.create({
      name: input.name,
      type: 'marketplace_campaign',
      sellerId: null,
      eligibleProductIds,
      discountType: input.discountType,
      discountValue: input.discountValue,
      startsAt,
      endsAt,
      status: startsAt > now ? 'scheduled' : 'active',
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    return campaign.toObject() as Promotion;
  }

  /** Updates a draft or scheduled marketplace campaign. */
  async updateMarketplaceCampaign(
    promotionId: string,
    changes: UpdateAdminMarketplaceCampaignRequest,
  ): Promise<Promotion> {
    if (!mongoose.isValidObjectId(promotionId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PROMOTION_ID',
        message: 'A valid promotion ID is required.',
      });
    }

    const promotionObjectId = new mongoose.Types.ObjectId(promotionId);
    const promotion = await PromotionModel.findOne({
      _id: promotionObjectId,
      type: 'marketplace_campaign',
    }).exec();

    if (!promotion) {
      throw new AppError({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
        message: 'The marketplace campaign does not exist.',
      });
    }

    if (promotion.status !== 'draft' && promotion.status !== 'scheduled') {
      throw new AppError({
        statusCode: 409,
        code: 'PROMOTION_NOT_EDITABLE',
        message: 'Only draft or scheduled marketplace campaigns can be updated.',
      });
    }

    const discountType = changes.discountType ?? promotion.discountType;
    const discountValue = changes.discountValue ?? promotion.discountValue;
    const startsAt = changes.startsAt ? new Date(changes.startsAt) : promotion.startsAt;
    const endsAt = changes.endsAt ? new Date(changes.endsAt) : promotion.endsAt;
    const now = new Date();

    if (discountType === 'percentage' && discountValue > 90) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_DISCOUNT_INVALID',
        message: 'Percentage discounts cannot exceed 90%.',
      });
    }

    if (startsAt >= endsAt) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_DATES_INVALID',
        message: 'The promotion end time must be later than its start time.',
      });
    }

    if (endsAt <= now) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_END_TIME_PASSED',
        message: 'The campaign end time must be in the future.',
      });
    }

    let eligibleProductIds = promotion.eligibleProductIds;

    if (changes.eligibleProductIds !== undefined) {
      eligibleProductIds = changes.eligibleProductIds.map(
        (productId) => new mongoose.Types.ObjectId(productId),
      );

      await validateMarketplaceCampaignProducts(eligibleProductIds);
    }

    const updatedPromotion = await PromotionModel.findOneAndUpdate(
      {
        _id: promotionObjectId,
        type: 'marketplace_campaign',
        status: { $in: ['draft', 'scheduled'] },
        updatedAt: promotion.updatedAt,
      },
      {
        $set: {
          name: changes.name ?? promotion.name,
          eligibleProductIds,
          discountType,
          discountValue,
          startsAt,
          endsAt,
          status: startsAt > now ? 'scheduled' : 'active',
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).exec();

    if (!updatedPromotion) {
      throw new AppError({
        statusCode: 409,
        code: 'PROMOTION_CHANGED_CONCURRENTLY',
        message: 'The campaign changed while you were updating it. Reload it and try again.',
      });
    }

    return updatedPromotion.toObject() as Promotion;
  }

  /** Cancels a draft, scheduled, or active marketplace campaign. */
  async cancelMarketplaceCampaign(promotionId: string): Promise<Promotion> {
    if (!mongoose.isValidObjectId(promotionId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PROMOTION_ID',
        message: 'A valid promotion ID is required.',
      });
    }

    const promotionObjectId = new mongoose.Types.ObjectId(promotionId);
    const promotion = await PromotionModel.findOne({
      _id: promotionObjectId,
      type: 'marketplace_campaign',
    }).exec();

    if (!promotion) {
      throw new AppError({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
        message: 'The marketplace campaign does not exist.',
      });
    }

    const cancellableStatuses = ['draft', 'scheduled', 'active'] as const;

    if (!cancellableStatuses.includes(promotion.status as (typeof cancellableStatuses)[number])) {
      throw new AppError({
        statusCode: 409,
        code: 'PROMOTION_NOT_CANCELLABLE',
        message: 'This marketplace campaign can no longer be cancelled.',
      });
    }

    const cancelledPromotion = await PromotionModel.findOneAndUpdate(
      {
        _id: promotionObjectId,
        type: 'marketplace_campaign',
        status: { $in: cancellableStatuses },
        updatedAt: promotion.updatedAt,
      },
      {
        $set: { status: 'cancelled' },
      },
      {
        new: true,
        runValidators: true,
      },
    ).exec();

    if (!cancelledPromotion) {
      throw new AppError({
        statusCode: 409,
        code: 'PROMOTION_CHANGED_CONCURRENTLY',
        message: 'The campaign changed while you were cancelling it. Reload it and try again.',
      });
    }

    return cancelledPromotion.toObject() as Promotion;
  }
}
