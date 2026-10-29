import type { PipelineStage } from 'mongoose';

import type { PublicProductNewArrivalsQuery } from '../schemas/public-product.schema.js';
import { buildPublicProductVisibilityStages } from './public-product-visibility.stages.js';

/** Builds the pipeline for the newest publicly visible products. */
export function buildPublicProductNewArrivalsPipeline(
  query: PublicProductNewArrivalsQuery,
): PipelineStage[] {
  return [
    ...buildPublicProductVisibilityStages(),
    { $sort: { publishedAt: -1, _id: -1 } },
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
