import { z } from 'zod';

import { paginationQuerySchema } from '../../../../../shared/pagination.js';
import { PRODUCT_MODERATION_STATUSES } from '../../../../sellers/products/management/types/product.types.js';

const adminReviewStatusSchema = z.enum(PRODUCT_MODERATION_STATUSES).exclude(['not_submitted']);

/** Validates pagination and moderation status for the administrator product list. */
export const adminProductListQuerySchema = paginationQuerySchema.extend({
  moderationStatus: adminReviewStatusSchema.default('pending'),
});

/** Parsed query parameters for the administrator product list. */
export type AdminProductListQuery = z.output<typeof adminProductListQuerySchema>;

/** Validates the product ID used by administrator moderation routes. */
export const adminProductIdParamsSchema = z
  .object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.'),
  })
  .strict();

/** Parsed product ID route parameter for administrator moderation. */
export type AdminProductIdParams = z.infer<typeof adminProductIdParamsSchema>;

const productModerationReasonFieldSchema = z
  .string()
  .trim()
  .min(20, 'The review reason must contain at least 20 characters.')
  .max(1000, 'The review reason must not exceed 1000 characters.');

/** Validates the required reason for an administrator moderation decision. */
export const adminProductReviewReasonSchema = z
  .object({
    reason: productModerationReasonFieldSchema,
  })
  .strict();

/** Schema alias for the product rejection endpoint. */
export const rejectAdminProductSchema = adminProductReviewReasonSchema;

/** Schema alias for the product changes-request endpoint. */
export const requestAdminProductChangesSchema = adminProductReviewReasonSchema;

/** Parsed rejection reason supplied by an administrator. */
export type RejectAdminProductRequest = z.infer<typeof rejectAdminProductSchema>;

/** Parsed changes-request reason supplied by an administrator. */
export type RequestAdminProductChangesRequest = z.infer<typeof requestAdminProductChangesSchema>;
