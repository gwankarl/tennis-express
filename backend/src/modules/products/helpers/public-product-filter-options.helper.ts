import mongoose, { type PipelineStage } from 'mongoose';

import { BrandModel } from '../../admin/brands/models/brand.model.js';
import { ProductModel } from '../../sellers/products/management/models/product.model.js';
import { buildPublicProductVisibilityStages } from './public-product-visibility.stages.js';
import type { PublicProductFilterMetadata } from '../types/public-product.types.js';

type PublicProductPriceRange = NonNullable<PublicProductFilterMetadata['priceRange']>;

interface PublicProductFilterFacetResult {
  brands: PublicProductFilterMetadata['brands'];
  priceRange: Array<Pick<PublicProductPriceRange, 'min' | 'max'>>;
}

interface PublicProductFilterOptions {
  brands: PublicProductFilterMetadata['brands'];
  priceRange: Pick<PublicProductPriceRange, 'min' | 'max'> | null;
}

/**
 * Finds filter choices among publicly visible products, optionally within one category.
 */
export async function getPublicProductFilterOptions(
  categoryId?: string,
): Promise<PublicProductFilterOptions> {
  const productFilters = categoryId ? { categoryId: new mongoose.Types.ObjectId(categoryId) } : {};

  const pipeline: PipelineStage[] = [
    ...buildPublicProductVisibilityStages(productFilters),
    {
      $facet: {
        brands: [
          { $match: { brandId: { $type: 'objectId' } } },
          {
            $lookup: {
              from: BrandModel.collection.name,
              localField: 'brandId',
              foreignField: '_id',
              pipeline: [{ $match: { status: 'active' } }, { $project: { name: 1, slug: 1 } }],
              as: 'activeBrand',
            },
          },
          { $unwind: '$activeBrand' },
          {
            $group: {
              _id: '$brandId',
              name: { $first: '$activeBrand.name' },
              slug: { $first: '$activeBrand.slug' },
            },
          },
          { $sort: { name: 1, _id: 1 } },
          {
            $project: {
              _id: 0,
              id: { $toString: '$_id' },
              name: 1,
              slug: 1,
            },
          },
        ],
        priceRange: [
          {
            $group: {
              _id: null,
              min: { $min: '$variantSummary.minPrice' },
              max: { $max: '$variantSummary.maxPrice' },
            },
          },
          { $project: { _id: 0, min: 1, max: 1 } },
        ],
      },
    },
  ];

  const [result] = await ProductModel.aggregate<PublicProductFilterFacetResult>(pipeline).exec();

  return {
    brands: result?.brands ?? [],
    priceRange: result?.priceRange[0] ?? null,
  };
}
