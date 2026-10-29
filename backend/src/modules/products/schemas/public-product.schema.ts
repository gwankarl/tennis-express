import { z } from 'zod';

import { paginationQuerySchema } from '../../../shared/pagination.js';
import { PRODUCT_CONDITIONS } from '../../sellers/products/management/types/product.types.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');
const priceSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER);

export const listPublicProductsQuerySchema = paginationQuerySchema
  .extend({
    categoryId: objectIdSchema.optional(),
    brandId: objectIdSchema.optional(),
    condition: z.enum(PRODUCT_CONDITIONS).optional(),
    sellerId: objectIdSchema.optional(),
    minPrice: priceSchema.optional(),
    maxPrice: priceSchema.optional(),
    availability: z.enum(['in_stock', 'out_of_stock']).optional(),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      path: ['maxPrice'],
      message: 'maxPrice must be greater than or equal to minPrice.',
    },
  );

export type ListPublicProductsQuery = z.output<typeof listPublicProductsQuerySchema>;
