import type { PipelineStage } from 'mongoose';

import { ProductEngagementEventModel } from '../models/product-engagement.model.js';
import type { PublicProductPopularQuery } from '../schemas/public-product.schema.js';
import { buildPublicProductVisibilityStages } from './public-product-visibility.stages.js';

const POPULARITY_WINDOW_DAYS = 30;
const WISHLIST_ADDITION_WEIGHT = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Builds a ranking pipeline for publicly visible products with recent activity. */
export function buildPublicProductPopularPipeline(
  query: PublicProductPopularQuery,
  now = new Date(),
): PipelineStage[] {
  const windowStart = new Date(now.getTime() - POPULARITY_WINDOW_DAYS * MILLISECONDS_PER_DAY);

  return [
    ...buildPublicProductVisibilityStages(),
    {
      $lookup: {
        from: ProductEngagementEventModel.collection.name,
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$productId', '$$productId'] },
                  { $gte: ['$occurredAt', windowStart] },
                  { $lt: ['$occurredAt', now] },
                ],
              },
            },
          },
          {
            $facet: {
              views: [{ $match: { eventType: 'view' } }, { $count: 'total' }],
              wishlistAdders: [
                { $match: { eventType: 'wishlist_add' } },
                { $group: { _id: '$actorKey' } },
                { $count: 'total' },
              ],
            },
          },
          {
            $project: {
              viewCount: {
                $ifNull: [{ $arrayElemAt: ['$views.total', 0] }, 0],
              },
              wishlistAdderCount: {
                $ifNull: [{ $arrayElemAt: ['$wishlistAdders.total', 0] }, 0],
              },
            },
          },
        ],
        as: 'engagementSummary',
      },
    },
    {
      $addFields: {
        popularityScore: {
          $add: [
            { $ifNull: [{ $arrayElemAt: ['$engagementSummary.viewCount', 0] }, 0] },
            {
              $multiply: [
                WISHLIST_ADDITION_WEIGHT,
                {
                  $ifNull: [{ $arrayElemAt: ['$engagementSummary.wishlistAdderCount', 0] }, 0],
                },
              ],
            },
          ],
        },
      },
    },
    { $match: { popularityScore: { $gt: 0 } } },
    { $sort: { popularityScore: -1, publishedAt: -1, _id: -1 } },
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
