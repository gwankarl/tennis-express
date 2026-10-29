import type { Types } from 'mongoose';

export const PURCHASE_STATUSES = ['pending_payment'] as const;

export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

/** Totals captured from the final acknowledged checkout quote. */
export interface PurchaseTotals {
  currency: 'XAF';
  subtotal: number;
  discount: number;
  fulfillmentTotal: number;
  total: number;
}

/** Customer purchase created from one confirmed checkout session. */
export interface Purchase extends PurchaseTotals {
  _id: Types.ObjectId;
  checkoutSessionId: Types.ObjectId;
  userId: Types.ObjectId;
  status: PurchaseStatus;
  confirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
