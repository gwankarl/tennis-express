import mongoose, { type PipelineStage } from 'mongoose';

import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
} from '../../../shared/pagination.js';
import { SellerApplicationModel } from '../../users/seller-applications/models/seller-application.model.js';
import { UserModel } from '../../users/profiles/models/user.model.js';
import { ProductModel } from '../../sellers/products/management/models/product.model.js';
import { ProductVariantModel } from '../../sellers/products/variants/models/product-variant.model.js';
import { StoreModel } from '../../sellers/store/models/store.model.js';
import type { PublicProductCard } from '../types/public-product.types.js';
import type { ListPublicProductsQuery } from '../schemas/public-product.schema.js';

interface PublicProductAggregationRow {
  _id: { toString(): string };
  name: string;
  slug: string;
  condition: PublicProductCard['condition'];
  publishedAt: Date | null;
  primaryImage: PublicProductCard['primaryImage'];
  eligibleStore: Array<{
    _id: { toString(): string };
    name: string;
    slug: string;
    logo?: { secureUrl?: string } | null;
    location: {
      region: string;
      city: string;
    };
  }>;
  variantSummary: Array<{
    minPrice: number;
    maxPrice: number;
    hasStock: number;
  }>;
}

interface PublicProductAggregationResult {
  products: PublicProductAggregationRow[];
  total: Array<{ totalItems: number }>;
}

export interface PublicProductListResult {
  products: PublicProductCard[];
  pagination: PaginationMetadata;
}

/** Retrieves publicly eligible products for marketplace browsing. */
export class PublicProductService {
  async list(query: ListPublicProductsQuery): Promise<PublicProductListResult> {
    const productMatch = {
      moderationStatus: 'approved',
      publicationStatus: 'published',
      name: { $type: 'string' },
      slug: { $type: 'string' },
      ...(query.categoryId ? { categoryId: new mongoose.Types.ObjectId(query.categoryId) } : {}),
      ...(query.brandId ? { brandId: new mongoose.Types.ObjectId(query.brandId) } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.sellerId ? { sellerId: new mongoose.Types.ObjectId(query.sellerId) } : {}),
    };

    const pipeline: PipelineStage[] = [
      {
        $match: productMatch,
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
      {
        $match: {
          ...(query.minPrice !== undefined
            ? { 'variantSummary.maxPrice': { $gte: query.minPrice } }
            : {}),
          ...(query.maxPrice !== undefined
            ? { 'variantSummary.minPrice': { $lte: query.maxPrice } }
            : {}),
          ...(query.availability === 'in_stock' ? { 'variantSummary.hasStock': { $gt: 0 } } : {}),
          ...(query.availability === 'out_of_stock' ? { 'variantSummary.hasStock': 0 } : {}),
        },
      },
      {
        $facet: {
          products: [
            { $sort: { publishedAt: -1, _id: -1 } },
            { $skip: getPaginationOffset(query) },
            { $limit: query.limit },
            {
              $project: {
                name: 1,
                slug: 1,
                condition: 1,
                publishedAt: 1,
                eligibleStore: 1,
                variantSummary: 1,
                primaryImage: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: { $ifNull: ['$images', []] },
                            as: 'image',
                            cond: { $eq: ['$$image.isPrimary', true] },
                          },
                        },
                        as: 'image',
                        in: {
                          secureUrl: '$$image.secureUrl',
                          altText: '$$image.altText',
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          ],
          total: [{ $count: 'totalItems' }],
        },
      },
    ];

    const [result] = await ProductModel.aggregate<PublicProductAggregationResult>(pipeline).exec();

    const products = (result?.products ?? []).flatMap((document) => {
      const store = document.eligibleStore[0];
      const variantSummary = document.variantSummary[0];

      // Eligibility lookups above should guarantee these values.
      if (!store || !variantSummary) return [];

      const availability: PublicProductCard['availability'] =
        variantSummary.hasStock > 0 ? 'in_stock' : 'out_of_stock';

      return [
        {
          id: document._id.toString(),
          name: document.name,
          slug: document.slug,
          condition: document.condition,
          primaryImage: document.primaryImage ?? null,
          priceRange: {
            min: variantSummary.minPrice,
            max: variantSummary.maxPrice,
          },
          availability,
          store: {
            id: store._id.toString(),
            name: store.name,
            slug: store.slug,
            logo: store.logo?.secureUrl ? { secureUrl: store.logo.secureUrl } : null,
            location: {
              region: store.location.region,
              city: store.location.city,
            },
          },
          publishedAt: document.publishedAt,
        },
      ];
    });

    const totalItems = result?.total[0]?.totalItems ?? 0;

    return {
      products,
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }
}
