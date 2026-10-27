import mongoose, { Schema } from 'mongoose';
import type { Types } from 'mongoose';

import {
  PROMOTION_DISCOUNT_TYPES,
  PROMOTION_STATUSES,
  PROMOTION_TYPES,
} from '../types/promotion.types.js';
import type { Promotion } from '../types/promotion.types.js';

const promotionSchema = new Schema<Promotion>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: PROMOTION_TYPES,
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    eligibleProductIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      required: true,
      default: [],
      validate: {
        validator(productIds: Types.ObjectId[]) {
          const uniqueIds = new Set(productIds.map((productId) => productId.toString()));

          return productIds.length > 0 && uniqueIds.size === productIds.length;
        },
        message: 'A promotion must include unique eligible product IDs.',
      },
    },
    discountType: {
      type: String,
      enum: PROMOTION_DISCOUNT_TYPES,
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'The discount value must be a positive safe integer.',
      },
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: PROMOTION_STATUSES,
      required: true,
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Enforces promotion rules that depend on more than one field.
 * The authenticated route service remains responsible for assigning ownership
 * and initial lifecycle status.
 */
promotionSchema.pre('validate', function () {
  if (this.type === 'seller_discount' && !this.sellerId) {
    this.invalidate('sellerId', 'Seller discounts must belong to a seller.');
  }

  if (this.type === 'marketplace_campaign' && this.sellerId !== null) {
    this.invalidate('sellerId', 'Marketplace campaigns cannot belong to a seller.');
  }

  if (this.discountType === 'percentage' && this.discountValue > 90) {
    this.invalidate('discountValue', 'Percentage discounts cannot exceed 90%.');
  }

  if (this.startsAt && this.endsAt && this.startsAt >= this.endsAt) {
    this.invalidate('endsAt', 'The promotion end time must be later than its start time.');
  }
});

// Supports seller promotion history lists.
promotionSchema.index({
  sellerId: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});

// Supports administrator lists filtered by promotion type and status.
promotionSchema.index({
  type: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});

// Supports finding active promotions for a product while checking the date window.
promotionSchema.index({
  eligibleProductIds: 1,
  status: 1,
  startsAt: 1,
  endsAt: 1,
});

export const PromotionModel =
  mongoose.models.Promotion || mongoose.model<Promotion>('Promotion', promotionSchema);
