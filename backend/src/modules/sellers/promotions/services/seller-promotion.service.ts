import mongoose, { type QueryFilter } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { SellerApplicationModel } from '../../../users/seller-applications/models/seller-application.model.js';
import { UserModel } from '../../../users/profiles/models/user.model.js';
import { ProductModel } from '../../products/management/models/product.model.js';
import { ProductVariantModel } from '../../products/variants/models/product-variant.model.js';
import { StoreModel } from '../../store/models/store.model.js';
import { PromotionModel } from '../models/promotion.model.js';
import type {
  CreateSellerPromotionRequest,
  ListSellerPromotionsQuery,
  UpdateSellerPromotionRequest,
} from '../schemas/seller-promotion.schema.js';

import type { Promotion } from '../types/promotion.types.js';
import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
} from '../../../../shared/pagination.js';

export interface SellerPromotionListResult {
  promotions: Promotion[];
  pagination: PaginationMetadata;
}

/** Creates a seller discount for eligible products in the authenticated seller's store. */
export class SellerPromotionService {
  async createPromotion(sellerId: string, input: CreateSellerPromotionRequest): Promise<Promotion> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const seller = await UserModel.findOne({
      _id: sellerObjectId,
      status: 'active',
      deletedAt: null,
    })
      .select('roles')
      .lean()
      .exec();

    if (!seller || !seller.roles.includes('seller')) {
      throw new AppError({
        statusCode: 403,
        code: 'SELLER_ACCOUNT_NOT_ELIGIBLE',
        message: 'An active seller account is required to create promotions.',
      });
    }

    const approvedApplication = await SellerApplicationModel.exists({
      applicantId: sellerObjectId,
      status: 'approved',
    }).exec();

    if (!approvedApplication) {
      throw new AppError({
        statusCode: 403,
        code: 'SELLER_APPLICATION_NOT_APPROVED',
        message: 'An approved seller application is required to create promotions.',
      });
    }

    const store = await StoreModel.findOne({
      sellerId: sellerObjectId,
      status: 'active',
    })
      .select('_id')
      .exec();

    if (!store) {
      throw new AppError({
        statusCode: 403,
        code: 'ACTIVE_STORE_REQUIRED',
        message: 'An active storefront is required to create promotions.',
      });
    }

    const productIds = input.eligibleProductIds.map(
      (productId) => new mongoose.Types.ObjectId(productId),
    );

    await this.validateEligibleProducts(sellerObjectId, store._id, productIds);
    const eligibleProductObjectIds = productIds;

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const now = new Date();

    if (endsAt <= now) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_END_TIME_PASSED',
        message: 'The promotion end time must be in the future.',
      });
    }

    const promotion = await PromotionModel.create({
      name: input.name,
      type: 'seller_discount',
      sellerId: sellerObjectId,
      eligibleProductIds: eligibleProductObjectIds,
      discountType: input.discountType,
      discountValue: input.discountValue,
      startsAt,
      endsAt,
      status: startsAt > now ? 'scheduled' : 'active',
      createdBy: sellerObjectId,
    });

    return promotion.toObject() as Promotion;
  }

  /** Updates a draft or scheduled promotion owned by the authenticated seller. */
  async updateOwnPromotion(
    sellerId: string,
    promotionId: string,
    changes: UpdateSellerPromotionRequest,
  ): Promise<Promotion> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    if (!mongoose.isValidObjectId(promotionId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PROMOTION_ID',
        message: 'A valid promotion ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const promotionObjectId = new mongoose.Types.ObjectId(promotionId);
    const promotion = await PromotionModel.findOne({
      _id: promotionObjectId,
      sellerId: sellerObjectId,
      type: 'seller_discount',
    }).exec();

    if (!promotion) {
      throw new AppError({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
        message: 'The promotion could not be found.',
      });
    }

    if (promotion.status !== 'draft' && promotion.status !== 'scheduled') {
      throw new AppError({
        statusCode: 409,
        code: 'PROMOTION_NOT_EDITABLE',
        message: 'Only draft or scheduled promotions can be updated.',
      });
    }

    const discountType = changes.discountType ?? promotion.discountType;
    const discountValue = changes.discountValue ?? promotion.discountValue;
    const startsAt = changes.startsAt ? new Date(changes.startsAt) : promotion.startsAt;
    const endsAt = changes.endsAt ? new Date(changes.endsAt) : promotion.endsAt;

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

    const now = new Date();

    if (endsAt <= now) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_END_TIME_PASSED',
        message: 'The promotion end time must be in the future.',
      });
    }

    let eligibleProductIds = promotion.eligibleProductIds;

    if (changes.eligibleProductIds !== undefined) {
      const store = await StoreModel.findOne({
        sellerId: sellerObjectId,
        status: 'active',
      })
        .select('_id')
        .exec();

      if (!store) {
        throw new AppError({
          statusCode: 403,
          code: 'ACTIVE_STORE_REQUIRED',
          message: 'An active storefront is required to change eligible products.',
        });
      }

      eligibleProductIds = changes.eligibleProductIds.map(
        (productId) => new mongoose.Types.ObjectId(productId),
      );

      await this.validateEligibleProducts(sellerObjectId, store._id, eligibleProductIds);
    }

    const updatedPromotion = await PromotionModel.findOneAndUpdate(
      {
        _id: promotionObjectId,
        sellerId: sellerObjectId,
        type: 'seller_discount',
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
        message: 'The promotion changed while you were updating it. Reload it and try again.',
      });
    }

    return updatedPromotion.toObject() as Promotion;
  }

  /** Retrieves the authenticated seller's promotions with pagination and an optional status filter. */
  async listOwnPromotions(
    sellerId: string,
    query: ListSellerPromotionsQuery,
  ): Promise<SellerPromotionListResult> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const filter: QueryFilter<Promotion> = {
      sellerId: sellerObjectId,
      type: 'seller_discount',
    };

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    const [documents, totalItems] = await Promise.all([
      PromotionModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .exec(),
      PromotionModel.countDocuments(filter).exec(),
    ]);

    return {
      promotions: documents.map((document) => document.toObject() as Promotion),
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }

  /** Retrieves a promotion only when it belongs to the authenticated seller. */
  async getOwnPromotion(sellerId: string, promotionId: string): Promise<Promotion> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    if (!mongoose.isValidObjectId(promotionId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PROMOTION_ID',
        message: 'A valid promotion ID is required.',
      });
    }

    const promotion = await PromotionModel.findOne({
      _id: new mongoose.Types.ObjectId(promotionId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
      type: 'seller_discount',
    }).exec();

    if (!promotion) {
      throw new AppError({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
        message: 'The promotion could not be found.',
      });
    }

    return promotion.toObject() as Promotion;
  }

  /** Cancels an eligible promotion owned by the authenticated seller. */
  async cancelOwnPromotion(sellerId: string, promotionId: string): Promise<Promotion> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    if (!mongoose.isValidObjectId(promotionId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PROMOTION_ID',
        message: 'A valid promotion ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const promotionObjectId = new mongoose.Types.ObjectId(promotionId);
    const promotion = await PromotionModel.findOne({
      _id: promotionObjectId,
      sellerId: sellerObjectId,
      type: 'seller_discount',
    }).exec();

    if (!promotion) {
      throw new AppError({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
        message: 'The promotion could not be found.',
      });
    }

    const cancellableStatuses = ['draft', 'scheduled', 'active'] as const;

    if (!cancellableStatuses.includes(promotion.status as (typeof cancellableStatuses)[number])) {
      throw new AppError({
        statusCode: 409,
        code: 'PROMOTION_NOT_CANCELLABLE',
        message: 'This promotion can no longer be cancelled.',
      });
    }

    const cancelledPromotion = await PromotionModel.findOneAndUpdate(
      {
        _id: promotionObjectId,
        sellerId: sellerObjectId,
        type: 'seller_discount',
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
        message: 'The promotion changed while you were cancelling it. Reload it and try again.',
      });
    }

    return cancelledPromotion.toObject() as Promotion;
  }

  /** Ensures every selected product is eligible for a seller promotion. */
  private async validateEligibleProducts(
    sellerId: mongoose.Types.ObjectId,
    storeId: mongoose.Types.ObjectId,
    productIds: mongoose.Types.ObjectId[],
  ): Promise<void> {
    const eligibleProducts = await ProductModel.find({
      _id: { $in: productIds },
      sellerId,
      storeId,
      moderationStatus: 'approved',
      publicationStatus: 'published',
    })
      .select('_id')
      .lean()
      .exec();

    if (eligibleProducts.length !== productIds.length) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_PRODUCTS_NOT_ELIGIBLE',
        message: 'All selected products must be published, approved products in your active store.',
      });
    }

    const activeVariants = await ProductVariantModel.find({
      productId: { $in: productIds },
      status: 'active',
    })
      .select('productId')
      .lean()
      .exec();

    const productsWithActiveVariants = new Set(
      activeVariants.map((variant) => variant.productId.toString()),
    );

    if (productIds.some((productId) => !productsWithActiveVariants.has(productId.toString()))) {
      throw new AppError({
        statusCode: 400,
        code: 'PROMOTION_PRODUCTS_REQUIRE_ACTIVE_VARIANTS',
        message: 'Each selected product must have at least one active variant.',
      });
    }
  }
}
