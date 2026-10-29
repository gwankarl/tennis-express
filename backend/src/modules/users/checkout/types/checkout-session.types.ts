import type { Types } from 'mongoose';
import type { PromotionType } from '../../../sellers/promotions/types/promotion.types.js';
import type {
  CameroonRegion,
  SellerFulfilmentMethod,
} from '../../seller-applications/types/seller-application.types.js';
import type { AddressDetails } from '../../addresses/types/address.types.js';
import type { StoreLocation } from '../../../sellers/store/types/store.types.js';

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
  fulfillment: CheckoutFulfillmentSelection | null;
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

/** One delivery or collection option currently offered by a seller. */
export interface CheckoutFulfillmentOption {
  method: SellerFulfilmentMethod;
  name: string;
  description: string;
  fee: number;
}

/** Fulfillment choices available for one seller's group in the session. */
export interface CheckoutSellerFulfillmentOptions {
  sellerId: string;
  storeId: string;
  storeName: string | null;
  options: CheckoutFulfillmentOption[];
}

/** Fulfillment choices for every seller group in a checkout session. */
export interface CheckoutFulfillmentOptionsResult {
  sessionId: string;
  destinationRegion: CameroonRegion;
  sellerGroups: CheckoutSellerFulfillmentOptions[];
}

/** Fulfillment choice and immutable location details captured for a seller group. */
export interface CheckoutFulfillmentSelection {
  method: SellerFulfilmentMethod;
  optionName: string;
  optionDescription: string;
  fee: number;
  savedAddressId: Types.ObjectId | null;
  deliveryAddressSnapshot: AddressDetails | null;
  collectionLocation: StoreLocation | null;
}

/** A price, promotion, or fulfillment-fee change found during revalidation. */
export type CheckoutMaterialChange =
  | {
      kind: 'unit_price';
      cartItemId: string;
      previousValue: number;
      currentValue: number;
    }
  | {
      kind: 'promotion';
      cartItemId: string;
      previousValue: CheckoutPromotionSnapshot | null;
      currentValue: CheckoutPromotionSnapshot | null;
    }
  | {
      kind: 'fulfillment_fee';
      sellerId: string;
      previousValue: number;
      currentValue: number;
    };

/** Updated checkout quote and changes the customer may need to review. */
export interface CheckoutRevalidationResult {
  checkoutSession: CheckoutSession;
  changes: CheckoutMaterialChange[];
}
