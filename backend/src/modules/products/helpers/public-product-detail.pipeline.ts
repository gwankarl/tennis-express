import mongoose, { type PipelineStage } from 'mongoose';

import { BrandModel } from '../../admin/brands/models/brand.model.js';
import { CategoryModel } from '../../admin/categories/models/category.model.js';
import { buildPublicProductVisibilityStages } from './public-product-visibility.stages.js';

/**
 * Builds a visibility-checked aggregation pipeline for one public product.
 */
export function buildPublicProductDetailPipeline(productId: string): PipelineStage[] {
  const productObjectId = new mongoose.Types.ObjectId(productId);

  return [
    ...buildPublicProductVisibilityStages({ _id: productObjectId }),
    {
      $lookup: {
        from: CategoryModel.collection.name,
        localField: 'categoryId',
        foreignField: '_id',
        pipeline: [{ $match: { status: 'active' } }, { $project: { name: 1, slug: 1 } }],
        as: 'activeCategory',
      },
    },
    {
      $lookup: {
        from: BrandModel.collection.name,
        localField: 'brandId',
        foreignField: '_id',
        pipeline: [{ $match: { status: 'active' } }, { $project: { name: 1, slug: 1 } }],
        as: 'activeBrand',
      },
    },
    {
      $unwind: {
        path: '$activeCategory',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$activeBrand',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        condition: 1,
        attributes: 1,
        options: 1,
        publishedAt: 1,
        images: {
          $map: {
            input: { $ifNull: ['$images', []] },
            as: 'image',
            in: {
              id: { $toString: '$$image._id' },
              secureUrl: '$$image.secureUrl',
              altText: '$$image.altText',
              isPrimary: '$$image.isPrimary',
              sortOrder: '$$image.sortOrder',
            },
          },
        },
        price: {
          min: { $arrayElemAt: ['$variantSummary.minPrice', 0] },
          max: { $arrayElemAt: ['$variantSummary.maxPrice', 0] },
          currency: 'XAF',
        },
        availability: {
          $cond: [
            { $gt: [{ $arrayElemAt: ['$variantSummary.hasStock', 0] }, 0] },
            'in_stock',
            'out_of_stock',
          ],
        },
        category: {
          $cond: [
            { $ifNull: ['$activeCategory._id', false] },
            {
              id: { $toString: '$activeCategory._id' },
              name: '$activeCategory.name',
              slug: '$activeCategory.slug',
            },
            null,
          ],
        },
        brand: {
          $cond: [
            { $ifNull: ['$activeBrand._id', false] },
            {
              id: { $toString: '$activeBrand._id' },
              name: '$activeBrand.name',
              slug: '$activeBrand.slug',
            },
            null,
          ],
        },
        variants: {
          $map: {
            input: {
              $ifNull: [{ $arrayElemAt: ['$variantSummary.variants', 0] }, []],
            },
            as: 'variant',
            in: {
              id: { $toString: '$$variant.id' },
              name: '$$variant.name',
              attributes: '$$variant.attributes',
              price: '$$variant.price',
              isDefault: '$$variant.isDefault',
              availability: {
                $cond: [{ $gt: ['$$variant.stockQuantity', 0] }, 'in_stock', 'out_of_stock'],
              },
            },
          },
        },
        store: { $arrayElemAt: ['$eligibleStore', 0] },
      },
    },
  ];
}
