import mongoose, { Schema } from 'mongoose';

import {
  CHECKOUT_SESSION_STATUSES,
  CheckoutFulfillmentSelection,
  type CheckoutLineSnapshot,
  type CheckoutPromotionSnapshot,
  type CheckoutQuote,
  type CheckoutSellerGroup,
  type CheckoutSession,
} from '../types/checkout-session.types.js';
import { PROMOTION_TYPES } from '../../../sellers/promotions/types/promotion.types.js';
import {
  CAMEROON_REGIONS,
  SELLER_FULFILMENT_METHODS,
} from '../../seller-applications/types/seller-application.types.js';
import type { AddressDetails } from '../../addresses/types/address.types.js';
import type { StoreLocation } from '../../../sellers/store/types/store.types.js';

const checkoutPromotionSnapshotSchema = new Schema<CheckoutPromotionSnapshot>(
  {
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: PROMOTION_TYPES,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
  },
  { _id: false },
);

const checkoutLineSnapshotSchema = new Schema<CheckoutLineSnapshot>(
  {
    cartItemId: { type: Schema.Types.ObjectId, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    productName: { type: String, required: true, trim: true },
    variantName: { type: String, required: true, trim: true },
    sku: { type: String, default: null },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    promotion: {
      type: checkoutPromotionSnapshotSchema,
      default: null,
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
    total: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
  },
  { _id: false },
);

const checkoutAddressSnapshotSchema = new Schema<AddressDetails>(
  {
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    region: { type: String, enum: CAMEROON_REGIONS, required: true },
    city: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    deliveryInstructions: { type: String, default: null },
  },
  { _id: false },
);

const checkoutCollectionLocationSchema = new Schema<StoreLocation>(
  {
    region: { type: String, enum: CAMEROON_REGIONS, required: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const checkoutFulfillmentSelectionSchema = new Schema<CheckoutFulfillmentSelection>(
  {
    method: {
      type: String,
      enum: SELLER_FULFILMENT_METHODS,
      required: true,
    },
    optionName: { type: String, required: true, trim: true },
    optionDescription: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    savedAddressId: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerAddress',
      default: null,
    },
    deliveryAddressSnapshot: {
      type: checkoutAddressSnapshotSchema,
      default: null,
    },
    collectionLocation: {
      type: checkoutCollectionLocationSchema,
      default: null,
    },
  },
  { _id: false },
);

const checkoutSellerGroupSchema = new Schema<CheckoutSellerGroup>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fulfillment: {
      type: checkoutFulfillmentSelectionSchema,
      default: null,
    },
    cartItemIds: {
      type: [Schema.Types.ObjectId],
      required: true,
      validate: (itemIds: Schema.Types.ObjectId[]) => itemIds.length > 0,
    },
  },
  { _id: false },
);

const checkoutQuoteSchema = new Schema<CheckoutQuote>(
  {
    version: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    currency: { type: String, enum: ['XAF'], required: true },
    subtotal: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    discount: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    fulfillmentTotal: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    total: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const checkoutSessionSchema = new Schema<CheckoutSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: CHECKOUT_SESSION_STATUSES,
      required: true,
      default: 'active',
    },
    lines: {
      type: [checkoutLineSnapshotSchema],
      required: true,
      validate: (lines: CheckoutLineSnapshot[]) => lines.length > 0,
    },
    sellerGroups: {
      type: [checkoutSellerGroupSchema],
      required: true,
      validate: (groups: CheckoutSellerGroup[]) => groups.length > 0,
    },
    quote: { type: checkoutQuoteSchema, required: true },
    acknowledgedQuoteVersion: { type: Number, default: null, min: 1 },
    expiresAt: { type: Date, required: true },
    confirmedPurchaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

checkoutSessionSchema.index({ userId: 1, createdAt: -1 });
checkoutSessionSchema.index({ status: 1, expiresAt: 1 });

export const CheckoutSessionModel =
  mongoose.models.CheckoutSession ??
  mongoose.model<CheckoutSession>('CheckoutSession', checkoutSessionSchema);
