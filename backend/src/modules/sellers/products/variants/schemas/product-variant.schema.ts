import { z } from 'zod';

import { PRODUCT_VARIANT_STATUSES } from '../types/product-variant.types.js';
import { paginationQuerySchema } from '../../../../../shared/pagination.js';

/**
 * Validates client-editable fields for a new product variant.
 * The server assigns product ownership, configurationKey, isDefault, and status.
 */
export const createProductVariantSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    attributes: z.record(z.string().trim().min(1), z.string().trim().min(1)).optional(),
    sku: z.string().trim().min(1).nullable().optional(),
    price: z
      .number()
      .int()
      .min(1)
      .refine(Number.isSafeInteger, 'Price must be a positive safe integer.'),
    stockQuantity: z
      .number()
      .int()
      .min(0)
      .refine(Number.isSafeInteger, 'Stock quantity must be a nonnegative safe integer.'),
  })
  .strict();

export type CreateProductVariantRequest = z.infer<typeof createProductVariantSchema>;

/** Validates pagination parameters for a product's variants list. */
export const listProductVariantsQuerySchema = paginationQuerySchema;

export type ListProductVariantsQuery = z.output<typeof listProductVariantsQuerySchema>;

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

/** Validates the product and variant IDs used by nested seller routes. */
export const productVariantParamsSchema = z
  .object({
    productId: objectIdSchema,
    variantId: objectIdSchema,
  })
  .strict();

export type ProductVariantParams = z.infer<typeof productVariantParamsSchema>;

/**
 * Validates partial seller-editable variant fields.
 * Product ownership, configurationKey, isDefault, and status remain server-controlled.
 */
export const updateProductVariantSchema = createProductVariantSchema
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Provide at least one variant field to update.',
  });

export type UpdateProductVariantRequest = z.infer<typeof updateProductVariantSchema>;

/** Validates the status accepted by the variant status endpoint. */
export const updateProductVariantStatusSchema = z
  .object({
    status: z.enum(PRODUCT_VARIANT_STATUSES),
  })
  .strict();

export type UpdateProductVariantStatusRequest = z.infer<typeof updateProductVariantStatusSchema>;
