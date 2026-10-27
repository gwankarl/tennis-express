import { z } from 'zod';

import {
  PRODUCT_CONDITIONS,
  PRODUCT_MODERATION_STATUSES,
  PRODUCT_PUBLICATION_STATUSES,
} from '../types/product.types.js';
import { paginationQuerySchema } from '../../../../shared/pagination.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

/** Validates the product ID used by seller-owned product routes. */
export const sellerProductIdParamsSchema = z
  .object({
    productId: objectIdSchema,
  })
  .strict();

export type SellerProductIdParams = z.infer<typeof sellerProductIdParamsSchema>;

/**
 * Validates pagination and filters supported by the seller product model.
 */
export const listSellerProductsQuerySchema = paginationQuerySchema.extend({
  publicationStatus: z.enum(PRODUCT_PUBLICATION_STATUSES).optional(),
  moderationStatus: z.enum(PRODUCT_MODERATION_STATUSES).optional(),
  condition: z.enum(PRODUCT_CONDITIONS).optional(),
});

export type ListSellerProductsQuery = z.output<typeof listSellerProductsQuerySchema>;

/**
 * Validates the optional client-editable fields accepted when creating a draft.
 * Ownership, slug, and product workflow statuses are assigned by the server.
 */
export const createProductDraftSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().min(10).max(10000).optional(),
    categoryId: objectIdSchema.optional(),
    brandId: objectIdSchema.nullable().optional(),
    condition: z.enum(PRODUCT_CONDITIONS).optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type CreateProductDraftRequest = z.infer<typeof createProductDraftSchema>;

/**
 * Validates seller-editable fields for a product update.
 * Ownership, slug, images, and workflow status are excluded.
 */
export const updateSellerProductSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().min(10).max(10000).optional(),
    categoryId: objectIdSchema.optional(),
    brandId: objectIdSchema.nullable().optional(),
    condition: z.enum(PRODUCT_CONDITIONS).optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Provide at least one product field to update.',
  });

export type UpdateSellerProductRequest = z.infer<typeof updateSellerProductSchema>;
