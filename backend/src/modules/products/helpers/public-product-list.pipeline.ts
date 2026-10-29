import type { PipelineStage } from 'mongoose';

import type { ListPublicProductsQuery } from '../schemas/public-product.schema.js';
import { buildPublicProductVisibilityStages } from './public-product-visibility.stages.js';

type ProductFilter = Record<string, unknown>;

function buildVariantFilterMatch(query: ListPublicProductsQuery): PipelineStage | null {
  const variantConditions: Record<string, unknown>[] = [];

  if (query.minPrice !== undefined) {
    variantConditions.push({
      'variantSummary.maxPrice': { $gte: query.minPrice },
    });
  }

  if (query.maxPrice !== undefined) {
    variantConditions.push({
      'variantSummary.minPrice': { $lte: query.maxPrice },
    });
  }

  if (query.availability === 'in_stock') {
    variantConditions.push({ 'variantSummary.hasStock': 1 });
  }

  if (query.availability === 'out_of_stock') {
    variantConditions.push({ 'variantSummary.hasStock': 0 });
  }

  return variantConditions.length > 0 ? { $match: { $and: variantConditions } } : null;
}

function buildProductSort(query: ListPublicProductsQuery): Record<string, 1 | -1> {
  switch (query.sort) {
    case 'price_asc':
      return { 'variantSummary.minPrice': 1, _id: 1 };
    case 'price_desc':
      return { 'variantSummary.minPrice': -1, _id: 1 };
    case 'newest':
    default:
      return { publishedAt: -1, _id: -1 };
  }
}

/**
 * Builds the aggregation pipeline for the public, filtered product listing.
 * Visibility checks run before filtering, counting, sorting, and pagination.
 */
export function buildPublicProductListPipeline(
  query: ListPublicProductsQuery,
  productFilters: ProductFilter,
): PipelineStage[] {
  const variantFilterMatch = buildVariantFilterMatch(query);

  return [
    ...buildPublicProductVisibilityStages(productFilters),
    ...(variantFilterMatch ? [variantFilterMatch] : []),
    {
      $facet: {
        products: [
          { $sort: buildProductSort(query) },
          { $skip: (query.page - 1) * query.limit },
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
        ],
        count: [{ $count: 'totalItems' }],
      },
    },
  ];
}
