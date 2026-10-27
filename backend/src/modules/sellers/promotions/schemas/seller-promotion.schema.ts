import { z } from 'zod';

import { paginationQuerySchema } from '../../../../shared/pagination.js';
import { PROMOTION_STATUSES } from '../types/promotion.types.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

/** Validates the promotion ID used by seller-owned promotion routes. */
export const sellerPromotionIdParamsSchema = z
  .object({
    promotionId: objectIdSchema,
  })
  .strict();

export type SellerPromotionIdParams = z.infer<typeof sellerPromotionIdParamsSchema>;

const eligibleProductIdsSchema = z
  .array(objectIdSchema)
  .min(1, 'Select at least one product.')
  .refine(
    (productIds) => new Set(productIds.map((id) => id.toLowerCase())).size === productIds.length,
    {
      message: 'Product IDs must be unique.',
    },
  );

/** Validates seller-editable fields when creating a seller discount. */
export const createSellerPromotionSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    eligibleProductIds: eligibleProductIdsSchema,
    discountType: z.enum(['percentage', 'fixed_amount']),
    discountValue: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine(
    (promotion) => {
      if (promotion.discountType === 'percentage') {
        return promotion.discountValue <= 90;
      }

      return true;
    },
    {
      path: ['discountValue'],
      message: 'Percentage discounts cannot exceed 90%.',
    },
  )
  .refine((promotion) => new Date(promotion.startsAt) < new Date(promotion.endsAt), {
    path: ['endsAt'],
    message: 'The promotion end time must be later than its start time.',
  });

export type CreateSellerPromotionRequest = z.infer<typeof createSellerPromotionSchema>;

/** Validates seller-editable changes to a promotion. */
export const updateSellerPromotionSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    eligibleProductIds: eligibleProductIdsSchema.optional(),
    discountType: z.enum(['percentage', 'fixed_amount']).optional(),
    discountValue: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
    startsAt: z.iso.datetime({ offset: true }).optional(),
    endsAt: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Provide at least one promotion field to update.',
  })
  .superRefine((changes, context) => {
    if (changes.discountType === 'percentage' && changes.discountValue !== undefined) {
      if (changes.discountValue > 90) {
        context.addIssue({
          code: 'custom',
          path: ['discountValue'],
          message: 'Percentage discounts cannot exceed 90%.',
        });
      }
    }

    if (changes.startsAt && changes.endsAt) {
      if (new Date(changes.startsAt) >= new Date(changes.endsAt)) {
        context.addIssue({
          code: 'custom',
          path: ['endsAt'],
          message: 'The promotion end time must be later than its start time.',
        });
      }
    }
  });

export type UpdateSellerPromotionRequest = z.infer<typeof updateSellerPromotionSchema>;

/** Validates pagination and the optional status filter for a seller's promotions. */
export const listSellerPromotionsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PROMOTION_STATUSES).optional(),
});

export type ListSellerPromotionsQuery = z.output<typeof listSellerPromotionsQuerySchema>;
