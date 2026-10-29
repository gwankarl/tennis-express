import mongoose, { Schema } from 'mongoose';

import {
  STOCK_RESERVATION_STATUSES,
  type StockReservation,
} from '../types/stock-reservation.types.js';

const stockReservationSchema = new Schema<StockReservation>(
  {
    checkoutSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'CheckoutSession',
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    status: {
      type: String,
      enum: STOCK_RESERVATION_STATUSES,
      required: true,
      default: 'active',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// A session reserves each variant once; retries must not create duplicate holds.
stockReservationSchema.index(
  { checkoutSessionId: 1, variantId: 1 },
  { unique: true, name: 'unique_session_variant_reservation' },
);

// Supports locating active reservations that have expired for explicit release.
stockReservationSchema.index({ status: 1, expiresAt: 1 });

export const StockReservationModel =
  mongoose.models.StockReservation ??
  mongoose.model<StockReservation>('StockReservation', stockReservationSchema);
