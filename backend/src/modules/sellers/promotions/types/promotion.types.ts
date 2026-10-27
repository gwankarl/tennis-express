import type { Types } from 'mongoose';

/** Promotion audience and ownership model. */
export const PROMOTION_TYPES = ['seller_discount', 'marketplace_campaign'] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

/** Supported ways to calculate a promotion discount. */
export const PROMOTION_DISCOUNT_TYPES = ['percentage', 'fixed_amount'] as const;
export type PromotionDiscountType = (typeof PROMOTION_DISCOUNT_TYPES)[number];

/** Stored lifecycle states for seller discounts and marketplace campaigns. */
export const PROMOTION_STATUSES = ['draft', 'scheduled', 'active', 'ended', 'cancelled'] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

/** TypeScript representation of a persisted promotion. */
export interface Promotion {
  _id: Types.ObjectId;
  name: string;
  type: PromotionType;
  sellerId: Types.ObjectId | null;
  eligibleProductIds: Types.ObjectId[];
  discountType: PromotionDiscountType;
  discountValue: number;
  startsAt: Date;
  endsAt: Date;
  status: PromotionStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
