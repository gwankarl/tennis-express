import mongoose, { type PipelineStage } from 'mongoose';

import type { PublicProductRelatedQuery } from '../schemas/public-product.schema.js';
import type { PublicProductDetail } from '../types/public-product.types.js';
import { buildPublicProductVisibilityStages } from './public-product-visibility.stages.js';

type RelatedProductSource = Pick<PublicProductDetail, 'id' | 'category' | 'brand' | 'price'>;

/** Builds a visibility-checked pipeline for products related by category, brand, and price. */
export function buildPublicProductRelatedPipeline(
  source: RelatedProductSource,
  query: PublicProductRelatedQuery,
): PipelineStage[] {
  const sourceId = new mongoose.Types.ObjectId(source.id);
  const categoryId = source.category?.id ? new mongoose.Types.ObjectId(source.category.id) : null;
  const brandId = source.brand?.id ? new mongoose.Types.ObjectId(source.brand.id) : null;

  const similarityFilters: Record<string, unknown>[] = [];

  if (categoryId) similarityFilters.push({ categoryId });
  if (brandId) similarityFilters.push({ brandId });

  const productFilters =
    similarityFilters.length > 0
      ? {
          $and: [{ _id: { $ne: sourceId } }, { $or: similarityFilters }],
        }
      : { _id: { $in: [] } };

  const relevanceTerms: Record<string, unknown>[] = [];

  if (categoryId) {
    relevanceTerms.push({
      $cond: [{ $eq: ['$categoryId', categoryId] }, 2, 0],
    });
  }

  if (brandId) {
    relevanceTerms.push({
      $cond: [{ $eq: ['$brandId', brandId] }, 1, 0],
    });
  }

  const sourcePrice = (source.price.min + source.price.max) / 2;
  const candidatePrice = {
    $divide: [
      {
        $add: [
          { $arrayElemAt: ['$variantSummary.minPrice', 0] },
          { $arrayElemAt: ['$variantSummary.maxPrice', 0] },
        ],
      },
      2,
    ],
  };

  return [
    ...buildPublicProductVisibilityStages(productFilters),
    {
      $addFields: {
        relatednessScore: relevanceTerms.length > 0 ? { $add: relevanceTerms } : 0,
        priceDistance: {
          $abs: {
            $subtract: [candidatePrice, sourcePrice],
          },
        },
      },
    },
    {
      $sort: {
        relatednessScore: -1,
        priceDistance: 1,
        publishedAt: -1,
        _id: -1,
      },
    },
    { $limit: query.limit },
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
}
