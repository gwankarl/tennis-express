import mongoose, { Schema } from 'mongoose';

import { PURCHASE_STATUSES, type Purchase } from '../types/purchase.types.js';

const purchaseSchema = new Schema<Purchase>(
  {
    checkoutSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'CheckoutSession',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: PURCHASE_STATUSES,
      required: true,
      default: 'pending_payment',
    },
    currency: {
      type: String,
      enum: ['XAF'],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    fulfillmentTotal: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    confirmedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Makes retrying confirmation return the single purchase for this session.
purchaseSchema.index(
  { checkoutSessionId: 1 },
  { unique: true, name: 'unique_purchase_per_checkout_session' },
);
purchaseSchema.index({ userId: 1, createdAt: -1 });

export const PurchaseModel =
  mongoose.models.Purchase ?? mongoose.model<Purchase>('Purchase', purchaseSchema);
