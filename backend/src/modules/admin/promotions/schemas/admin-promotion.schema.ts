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

/** Validates pagination and optional filters for the administrator promotion list. */
export const adminPromotionListQuerySchema = paginationQuerySchema.extend({
  type: z.enum(PROMOTION_TYPES).optional(),
  status: z.enum(PROMOTION_STATUSES).optional(),
});

export type AdminPromotionListQuery = z.output<typeof adminPromotionListQuerySchema>;

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
