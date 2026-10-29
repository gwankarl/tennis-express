import type { Types } from 'mongoose';

import type {
  CheckoutFulfillmentSelection,
  CheckoutPromotionSnapshot,
} from '../../checkout/types/checkout-session.types.js';
import type { PurchaseStatus } from '../../purchases/types/purchase.types.js';

/** Immutable product and discount details copied from a checkout line. */
export interface OrderLineSnapshot {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
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

/** One seller's portion of a confirmed customer purchase. */
export interface Order {
  _id: Types.ObjectId;
  purchaseId: Types.ObjectId;
  checkoutSessionId: Types.ObjectId;
  sellerId: Types.ObjectId;
  storeId: Types.ObjectId;
  storeName: string;
  status: PurchaseStatus;
  lines: OrderLineSnapshot[];
  fulfillment: CheckoutFulfillmentSelection;
  currency: 'XAF';
  subtotal: number;
  discount: number;
  fulfillmentFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
