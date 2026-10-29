import type { PipelineStage } from 'mongoose';

import { SellerApplicationModel } from '../../users/seller-applications/models/seller-application.model.js';
import { UserModel } from '../../users/profiles/models/user.model.js';
import { ProductVariantModel } from '../../sellers/products/variants/models/product-variant.model.js';
import { StoreModel } from '../../sellers/store/models/store.model.js';

type ProductFilter = Record<string, unknown>;

/**
 * Builds the shared aggregation stages that restrict products to publicly
 * visible listings and attach their public store and active-variant summary.
 */
export function buildPublicProductVisibilityStages(
  productFilters: ProductFilter = {},
): PipelineStage[] {
  return [
    {
      $match: {
        ...productFilters,
        moderationStatus: 'approved',
        publicationStatus: 'published',
        name: { $type: 'string' },
        slug: { $type: 'string' },
      },
    },
    {
      $lookup: {
        from: StoreModel.collection.name,
        localField: 'storeId',
        foreignField: '_id',
        let: { productSellerId: '$sellerId' },
        pipeline: [
          {
            $match: {
              status: 'active',
              $expr: { $eq: ['$sellerId', '$$productSellerId'] },
            },
          },
          {
            $project: {
              name: 1,
              slug: 1,
              'logo.secureUrl': 1,
              'location.region': 1,
              'location.city': 1,
            },
          },
        ],
        as: 'eligibleStore',
      },
    },
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: 'sellerId',
        foreignField: '_id',
        pipeline: [
          {
            $match: {
              status: 'active',
              deletedAt: null,
              roles: 'seller',
            },
          },
          { $project: { _id: 1 } },
        ],
        as: 'eligibleSeller',
      },
    },
    {
      $lookup: {
        from: SellerApplicationModel.collection.name,
        localField: 'sellerId',
        foreignField: 'applicantId',
        pipeline: [{ $match: { status: 'approved' } }, { $project: { _id: 1 } }],
        as: 'approvedApplication',
      },
    },
    {
      $lookup: {
        from: ProductVariantModel.collection.name,
        localField: '_id',
        foreignField: 'productId',
        pipeline: [
          { $match: { status: 'active' } },
          { $sort: { isDefault: -1, createdAt: 1, _id: 1 } },
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' },
              hasStock: {
                $max: {
                  $cond: [{ $gt: ['$stockQuantity', 0] }, 1, 0],
                },
              },
              variants: {
                $push: {
                  id: '$_id',
                  name: '$name',
                  attributes: '$attributes',
                  price: '$price',
                  stockQuantity: '$stockQuantity',
                  isDefault: '$isDefault',
                },
              },
            },
          },
        ],
        as: 'variantSummary',
      },
    },
    {
      $match: {
        'eligibleStore.0': { $exists: true },
        'eligibleSeller.0': { $exists: true },
        'approvedApplication.0': { $exists: true },
        'variantSummary.0': { $exists: true },
      },
    },
  ];
}
