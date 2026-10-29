import { z } from 'zod';

import { paginationQuerySchema } from '../../../shared/pagination.js';
import { PRODUCT_CONDITIONS } from '../../sellers/products/management/types/product.types.js';
import {
  PUBLIC_PRODUCT_AVAILABILITY_OPTIONS,
  PUBLIC_PRODUCT_SORT_OPTIONS,
} from '../types/public-product.types.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');
export const publicProductIdParamsSchema = z.object({
  productId: objectIdSchema,
});

export type PublicProductIdParams = z.output<typeof publicProductIdParamsSchema>;

const priceSchema = z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER);

export const publicProductFiltersQuerySchema = z.object({
  categoryId: objectIdSchema.optional(),
});

export type PublicProductFiltersQuery = z.output<typeof publicProductFiltersQuerySchema>;

export const publicProductNewArrivalsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export type PublicProductNewArrivalsQuery = z.output<
  typeof publicProductNewArrivalsQuerySchema
>;

export const publicProductRelatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(8),
});

export type PublicProductRelatedQuery = z.output<typeof publicProductRelatedQuerySchema>;

const baseQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(150).optional(),
  categoryId: objectIdSchema.optional(),
  brandId: objectIdSchema.optional(),
  condition: z.enum(PRODUCT_CONDITIONS).optional(),
  sellerId: objectIdSchema.optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
  availability: z.enum(PUBLIC_PRODUCT_AVAILABILITY_OPTIONS).optional(),
  sort: z.enum(PUBLIC_PRODUCT_SORT_OPTIONS).default('newest'),
});

const knownQueryKeys = new Set(Object.keys(baseQuerySchema.shape));
const attributeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listPublicProductsQuerySchema = baseQuerySchema
  .catchall(z.string())
  .superRefine((query, context) => {
    const attributeKeys = Object.keys(query).filter((key) => key.startsWith('attr.'));

    for (const key of Object.keys(query)) {
      if (knownQueryKeys.has(key)) continue;

      const slug = key.startsWith('attr.') ? key.slice('attr.'.length) : '';

      if (!slug || !attributeSlugPattern.test(slug)) {
        context.addIssue({
          code: 'custom',
          path: [key],
          message: 'Use a valid attr.<attribute-slug> query parameter.',
        });
      }
    }

    if (attributeKeys.length > 0 && !query.categoryId) {
      context.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'categoryId is required when filtering by category attributes.',
      });
    }

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['maxPrice'],
        message: 'maxPrice must be greater than or equal to minPrice.',
      });
    }
  })
  .transform((query) => {
    const attributeFilters: Record<string, string> = {};

    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('attr.')) {
        attributeFilters[key.slice('attr.'.length)] = value as string;
      }
    }

    return {
      page: query.page,
      limit: query.limit,
      q: query.q,
      categoryId: query.categoryId,
      brandId: query.brandId,
      condition: query.condition,
      sellerId: query.sellerId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      availability: query.availability,
      sort: query.sort,
      attributeFilters,
    };
  });

export type ListPublicProductsQuery = z.output<typeof listPublicProductsQuerySchema>;
