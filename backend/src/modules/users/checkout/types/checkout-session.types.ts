import type { Types } from 'mongoose';
import type { PromotionType } from '../../../sellers/promotions/types/promotion.types.js';

export const CHECKOUT_SESSION_STATUSES = ['active', 'expired', 'cancelled', 'confirmed'] as const;

export type CheckoutSessionStatus = (typeof CHECKOUT_SESSION_STATUSES)[number];

export interface CheckoutPromotionSnapshot {
  promotionId: Types.ObjectId;
  name: string;
  type: PromotionType;
  discountAmount: number;
}

/** Immutable product and price data captured when checkout starts. */
export interface CheckoutLineSnapshot {
  cartItemId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  sellerId: Types.ObjectId;
  storeId: Types.ObjectId;
  productName: string;
  variantName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  promotion: CheckoutPromotionSnapshot | null;
  subtotal: number;
  discount: number;
  total: number;
}

/** A seller's selected lines; fulfillment is chosen in a later checkout step. */
export interface CheckoutSellerGroup {
  sellerId: Types.ObjectId;
  cartItemIds: Types.ObjectId[];
}

/** Versioned XAF totals, recalculated when checkout details change. */
export interface CheckoutQuote {
  version: number;
  currency: 'XAF';
  subtotal: number;
  discount: number;
  fulfillmentTotal: number;
  total: number;
  createdAt: Date;
}

/** Persistent checkout state used by the checkout-session endpoints. */
export interface CheckoutSession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: CheckoutSessionStatus;
  lines: CheckoutLineSnapshot[];
  sellerGroups: CheckoutSellerGroup[];
  quote: CheckoutQuote;
  acknowledgedQuoteVersion: number | null;
  expiresAt: Date;
  confirmedPurchaseId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
