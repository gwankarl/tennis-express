import { z } from 'zod';

import { paginationQuerySchema } from '../../../../shared/pagination.js';
import {
  PROMOTION_STATUSES,
  PROMOTION_TYPES,
} from '../../../sellers/promotions/types/promotion.types.js';
import {
  createSellerPromotionSchema,
  updateSellerPromotionSchema,
} from '../../../sellers/promotions/schemas/seller-promotion.schema.js';

const objectIdQuerySchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

/** Validates pagination and optional filters for the administrator promotion list. */
export const adminPromotionListQuerySchema = paginationQuerySchema.extend({
  type: z.enum(PROMOTION_TYPES).optional(),
  status: z.enum(PROMOTION_STATUSES).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sellerId: objectIdQuerySchema.optional(),
});
export type AdminPromotionListQuery = z.output<typeof adminPromotionListQuerySchema>;

export const adminEligibleProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  sellerId: objectIdQuerySchema.optional(),
  storeId: objectIdQuerySchema.optional(),
  categoryId: objectIdQuerySchema.optional(),
});

export type AdminEligibleProductsQuery = z.output<typeof adminEligibleProductsQuerySchema>;

/** Validates the promotion ID used by administrator promotion routes. */
export const adminPromotionIdParamsSchema = z
  .object({
    promotionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.'),
  })
  .strict();

/** Validates the editable fields for an administrator-created marketplace campaign. */
export const createAdminMarketplaceCampaignSchema = createSellerPromotionSchema;

export type CreateAdminMarketplaceCampaignRequest = z.infer<
  typeof createAdminMarketplaceCampaignSchema
>;

/** Validates editable fields for an administrator campaign update. */
export const updateAdminMarketplaceCampaignSchema = updateSellerPromotionSchema;

export type UpdateAdminMarketplaceCampaignRequest = z.infer<
  typeof updateAdminMarketplaceCampaignSchema
>;

export type AdminPromotionIdParams = z.infer<typeof adminPromotionIdParamsSchema>;
