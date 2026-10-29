import type { Types } from 'mongoose';

export const STOCK_RESERVATION_STATUSES = ['active', 'released', 'consumed'] as const;

export type StockReservationStatus = (typeof STOCK_RESERVATION_STATUSES)[number];

/** Tracks inventory held for one variant in one checkout session. */
export interface StockReservation {
  _id: Types.ObjectId;
  checkoutSessionId: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;
  status: StockReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
