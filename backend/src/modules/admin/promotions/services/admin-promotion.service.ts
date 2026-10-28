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
  AdminEligibleProductsQuery,
} from '../schemas/admin-promotion.schema.js';

import { CategoryModel } from '../../categories/models/category.model.js';
import { SellerApplicationModel } from '../../../users/seller-applications/models/seller-application.model.js';
import { UserModel } from '../../../users/profiles/models/user.model.js';
import { ProductModel } from '../../../sellers/products/management/models/product.model.js';
import type {
  Product,
  ProductModerationStatus,
  ProductPublicationStatus,
} from '../../../sellers/products/management/types/product.types.js';
import { ProductVariantModel } from '../../../sellers/products/variants/models/product-variant.model.js';
import { StoreModel } from '../../../sellers/store/models/store.model.js';

import { validateMarketplaceCampaignProducts } from '../helpers/admin-promotion-product-eligibility.helper.js';

export interface AdminPromotionListItem extends Promotion {
  seller: {
    id: string;
    userName: string;
  } | null;
  store: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AdminPromotionListResult {
  promotions: AdminPromotionListItem[];
  pagination: PaginationMetadata;
}

export interface AdminEligibleProductListItem {
  id: string;
  name: string | null;
  moderationStatus: 'approved';
  publicationStatus: 'published';
  primaryImage: {
    secureUrl: string;
    altText: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  seller: {
    id: string;
    userName: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
  activeVariants: {
    count: number;
    minimumPrice: number;
    maximumPrice: number;
  };
}

export interface AdminPromotionProductDetails {
  id: string;
  name: string | null;
  slug: string | null;
  moderationStatus: ProductModerationStatus | null;
  publicationStatus: ProductPublicationStatus | null;
  primaryImage: {
    secureUrl: string;
    altText: string;
  } | null;
  seller: {
    id: string;
    userName: string;
  } | null;
  store: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AdminPromotionDetails extends Promotion {
  seller: {
    id: string;
    userName: string;
  } | null;
  store: {
    id: string;
    name: string;
    slug: string;
  } | null;
  eligibleProducts: AdminPromotionProductDetails[];
}

export interface AdminEligibleProductListResult {
  products: AdminEligibleProductListItem[];
  pagination: PaginationMetadata;
}

interface EligibleProductAggregateRow {
  _id: mongoose.Types.ObjectId;
  name?: string;
  moderationStatus: 'approved';
  publicationStatus: 'published';
  sellerId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  primaryImage: {
    secureUrl: string;
    altText: string;
  } | null;
  categoryId?: mongoose.Types.ObjectId;
  categoryInfo?: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
  sellerInfo: {
    _id: mongoose.Types.ObjectId;
    profile: {
      userName: string;
    };
  };
  storeInfo: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
  };
  activeVariantSummary: {
    count: number;
    minimumPrice: number;
    maximumPrice: number;
  };
}

interface EligibleProductFacetResult {
  results: EligibleProductAggregateRow[];
  metadata: Array<{ totalItems: number }>;
}

/** Provides administrator operations for seller discounts and marketplace campaigns. */
export class AdminPromotionService {
  /** Lists promotions with optional filters and seller/store summaries. */
  async list(input: AdminPromotionListQuery): Promise<AdminPromotionListResult> {
    const filter: QueryFilter<Promotion> = {};

    if (input.type !== undefined) {
      filter.type = input.type;
    }

    if (input.status !== undefined) {
      filter.status = input.status;
    }

    if (input.sellerId !== undefined) {
      filter.sellerId = new mongoose.Types.ObjectId(input.sellerId);
    }

    const escapedSearch = input.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (escapedSearch) {
      filter.name = { $regex: escapedSearch, $options: 'i' };
    }

    const [documents, totalItems] = await Promise.all([
      PromotionModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(getPaginationOffset(input))
        .limit(input.limit)
        .exec(),
      PromotionModel.countDocuments(filter).exec(),
    ]);

    const promotionRecords = documents.map((document) => document.toObject() as Promotion);

    const sellerIds = [
      ...new Set(
        promotionRecords.flatMap((promotion) =>
          promotion.sellerId ? [promotion.sellerId.toString()] : [],
        ),
      ),
    ];
    const sellerObjectIds = sellerIds.map((sellerId) => new mongoose.Types.ObjectId(sellerId));

    const [sellerDocuments, storeDocuments] = sellerObjectIds.length
      ? await Promise.all([
          UserModel.find({ _id: { $in: sellerObjectIds } })
            .select('_id profile.userName')
            .exec(),
          StoreModel.find({ sellerId: { $in: sellerObjectIds } })
            .select('_id sellerId name slug')
            .exec(),
        ])
      : [[], []];

    const sellersById = new Map(
      sellerDocuments.map((seller) => [
        seller._id.toString(),
        {
          id: seller._id.toString(),
          userName: seller.profile.userName,
        },
      ]),
    );

    const storesBySellerId = new Map(
      storeDocuments.map((store) => [
        store.sellerId.toString(),
        {
          id: store._id.toString(),
          name: store.name,
          slug: store.slug,
        },
      ]),
    );

    return {
      promotions: promotionRecords.map((promotion) => {
        const sellerId = promotion.sellerId?.toString();

        return {
          ...promotion,
          seller: sellerId ? (sellersById.get(sellerId) ?? null) : null,
          store: sellerId ? (storesBySellerId.get(sellerId) ?? null) : null,
        };
      }),
      pagination: buildPaginationMetadata(input, totalItems),
    };
  }

  /** Lists products that meet the current marketplace campaign eligibility rules. */
  async listEligibleProducts(
    input: AdminEligibleProductsQuery,
  ): Promise<AdminEligibleProductListResult> {
    const productFilter: QueryFilter<Product> = {
      moderationStatus: 'approved',
      publicationStatus: 'published',
    };

    if (input.sellerId) {
      productFilter.sellerId = new mongoose.Types.ObjectId(input.sellerId);
    }

    if (input.storeId) {
      productFilter.storeId = new mongoose.Types.ObjectId(input.storeId);
    }

    if (input.categoryId) {
      productFilter.categoryId = new mongoose.Types.ObjectId(input.categoryId);
    }

    const escapedSearch = input.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchExpression = escapedSearch ? { $regex: escapedSearch, $options: 'i' } : undefined;

    const pipeline: mongoose.PipelineStage[] = [
      { $match: productFilter },

      {
        $lookup: {
          from: StoreModel.collection.name,
          localField: 'storeId',
          foreignField: '_id',
          as: 'storeInfo',
        },
      },
      { $unwind: '$storeInfo' },
      {
        $match: {
          'storeInfo.status': 'active',
          $expr: { $eq: ['$storeInfo.sellerId', '$sellerId'] },
        },
      },

      {
        $lookup: {
          from: UserModel.collection.name,
          localField: 'sellerId',
          foreignField: '_id',
          as: 'sellerInfo',
        },
      },
      { $unwind: '$sellerInfo' },
      {
        $match: {
          'sellerInfo.status': 'active',
          'sellerInfo.deletedAt': null,
          'sellerInfo.roles': 'seller',
        },
      },

      {
        $lookup: {
          from: SellerApplicationModel.collection.name,
          let: { productSellerId: '$sellerId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$applicantId', '$$productSellerId'] },
                status: 'approved',
              },
            },
            { $project: { _id: 1 } },
            { $limit: 1 },
          ],
          as: 'approvedApplication',
        },
      },
      { $match: { 'approvedApplication.0': { $exists: true } } },

      {
        $lookup: {
          from: ProductVariantModel.collection.name,
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$productId', '$$productId'] },
                status: 'active',
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                minimumPrice: { $min: '$price' },
                maximumPrice: { $max: '$price' },
              },
            },
          ],
          as: 'activeVariantSummary',
        },
      },
      { $unwind: '$activeVariantSummary' },

      {
        $lookup: {
          from: CategoryModel.collection.name,
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true,
        },
      },

      ...(searchExpression
        ? [
            {
              $match: {
                $or: [
                  { name: searchExpression },
                  { 'sellerInfo.profile.userName': searchExpression },
                  { 'storeInfo.name': searchExpression },
                ],
              },
            } as mongoose.PipelineStage,
          ]
        : []),

      {
        $set: {
          primaryImage: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$images',
                      as: 'image',
                      cond: { $eq: ['$$image.isPrimary', true] },
                    },
                  },
                  0,
                ],
              },
              null,
            ],
          },
        },
      },

      {
        $facet: {
          results: [
            { $sort: { updatedAt: -1, _id: -1 } },
            { $skip: getPaginationOffset(input) },
            { $limit: input.limit },
            {
              $project: {
                _id: 1,
                name: 1,
                moderationStatus: 1,
                publicationStatus: 1,
                primaryImage: {
                  secureUrl: '$primaryImage.secureUrl',
                  altText: '$primaryImage.altText',
                },
                categoryInfo: 1,
                sellerInfo: 1,
                storeInfo: 1,
                activeVariantSummary: 1,
              },
            },
          ],
          metadata: [{ $count: 'totalItems' }],
        },
      },
    ];

    const [facet] = await ProductModel.aggregate<EligibleProductFacetResult>(pipeline).exec();
    const rows = facet?.results ?? [];
    const totalItems = facet?.metadata[0]?.totalItems ?? 0;

    return {
      products: rows.map((product) => ({
        id: product._id.toString(),
        name: product.name ?? null,
        moderationStatus: product.moderationStatus,
        publicationStatus: product.publicationStatus,
        primaryImage:
          product.primaryImage?.secureUrl && product.primaryImage.altText
            ? {
                secureUrl: product.primaryImage.secureUrl,
                altText: product.primaryImage.altText,
              }
            : null,
        category: product.categoryInfo
          ? {
              id: product.categoryInfo._id.toString(),
              name: product.categoryInfo.name,
            }
          : null,
        seller: {
          id: product.sellerInfo._id.toString(),
          userName: product.sellerInfo.profile.userName,
        },
        store: {
          id: product.storeInfo._id.toString(),
          name: product.storeInfo.name,
          slug: product.storeInfo.slug,
        },
        activeVariants: {
          count: product.activeVariantSummary.count,
          minimumPrice: product.activeVariantSummary.minimumPrice,
          maximumPrice: product.activeVariantSummary.maximumPrice,
        },
      })),
      pagination: buildPaginationMetadata(input, totalItems),
    };
  }

  /** Retrieves promotion details and safe summaries for its owner and eligible products. */
  async getById(promotionId: string): Promise<AdminPromotionDetails> {
    if (!mongoose.isValidObjectId(promotionId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PROMOTION_ID',
        message: 'A valid promotion ID is required.',
      });
    }

    const promotionDocument = await PromotionModel.findById(promotionId).exec();

    if (!promotionDocument) {
      throw new AppError({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
        message: 'The promotion does not exist.',
      });
    }

    const promotion = promotionDocument.toObject() as Promotion;
    const productDocuments = await ProductModel.find({
      _id: { $in: promotion.eligibleProductIds },
    })
      .select('_id name slug moderationStatus publicationStatus sellerId storeId images')
      .exec();

    const productSellerIds = productDocuments.map((product) => product.sellerId.toString());
    const sellerIds = [
      ...new Set([
        ...(promotion.sellerId ? [promotion.sellerId.toString()] : []),
        ...productSellerIds,
      ]),
    ];
    const sellerObjectIds = sellerIds.map((sellerId) => new mongoose.Types.ObjectId(sellerId));
    const storeIds = productDocuments.map((product) => product.storeId);
    const storeLookupConditions = [
      ...(sellerObjectIds.length ? [{ sellerId: { $in: sellerObjectIds } }] : []),
      ...(storeIds.length ? [{ _id: { $in: storeIds } }] : []),
    ];

    const [sellerDocuments, storeDocuments] = await Promise.all([
      sellerObjectIds.length
        ? UserModel.find({ _id: { $in: sellerObjectIds } })
            .select('_id profile.userName')
            .exec()
        : Promise.resolve([]),
      storeLookupConditions.length
        ? StoreModel.find({ $or: storeLookupConditions }).select('_id sellerId name slug').exec()
        : Promise.resolve([]),
    ]);

    const sellersById = new Map(
      sellerDocuments.map((seller) => [
        seller._id.toString(),
        {
          id: seller._id.toString(),
          userName: seller.profile.userName,
        },
      ]),
    );

    const storesById = new Map(
      storeDocuments.map((store) => [
        store._id.toString(),
        {
          id: store._id.toString(),
          name: store.name,
          slug: store.slug,
        },
      ]),
    );

    const storesBySellerId = new Map(
      storeDocuments.map((store) => [
        store.sellerId.toString(),
        {
          id: store._id.toString(),
          name: store.name,
          slug: store.slug,
        },
      ]),
    );

    const productsById = new Map(
      productDocuments.map((product) => [product._id.toString(), product]),
    );

    const ownerId = promotion.sellerId?.toString();

    return {
      ...promotion,
      seller: ownerId ? (sellersById.get(ownerId) ?? null) : null,
      store: ownerId ? (storesBySellerId.get(ownerId) ?? null) : null,
      eligibleProducts: promotion.eligibleProductIds.map((productId) => {
        const id = productId.toString();
        const product = productsById.get(id);

        if (!product) {
          return {
            id,
            name: null,
            slug: null,
            moderationStatus: null,
            publicationStatus: null,
            primaryImage: null,
            seller: null,
            store: null,
          };
        }

        const primaryImage =
          product.images.find((image: Product['images'][number]) => image.isPrimary) ??
          product.images[0] ??
          null;
        const sellerId = product.sellerId.toString();
        const storeId = product.storeId.toString();

        return {
          id,
          name: product.name ?? null,
          slug: product.slug ?? null,
          moderationStatus: product.moderationStatus,
          publicationStatus: product.publicationStatus,
          primaryImage: primaryImage
            ? {
                secureUrl: primaryImage.secureUrl,
                altText: primaryImage.altText,
              }
            : null,
          seller: sellersById.get(sellerId) ?? null,
          store: storesById.get(storeId) ?? null,
        };
      }),
    };
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
