import { z } from 'zod';

import { paginationQuerySchema } from '../../../../shared/pagination.js';
import { BRAND_STATUSES } from '../types/brand.types.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

const brandNameSchema = z.string().trim().min(1).max(120);
const brandDescriptionSchema = z.string().trim().max(2000).nullable();

export const brandIdParamsSchema = z
  .object({
    brandId: objectIdSchema,
  })
  .strict();

export const listBrandsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(BRAND_STATUSES).optional(),
});

export const createBrandSchema = z
  .object({
    name: brandNameSchema,
    description: brandDescriptionSchema.optional(),
  })
  .strict();

export const updateBrandSchema = z
  .object({
    name: brandNameSchema.optional(),
    description: brandDescriptionSchema.optional(),
  })
  .strict();

export const updateBrandStatusSchema = z
  .object({
    status: z.enum(BRAND_STATUSES),
  })
  .strict();

export type BrandIdParams = z.infer<typeof brandIdParamsSchema>;
export type ListBrandsQuery = z.output<typeof listBrandsQuerySchema>;
export type CreateBrandRequest = z.infer<typeof createBrandSchema>;
export type UpdateBrandRequest = z.infer<typeof updateBrandSchema>;
export type UpdateBrandStatusRequest = z.infer<typeof updateBrandStatusSchema>;
