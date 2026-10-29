import mongoose, { Schema } from 'mongoose';

import { PROMOTION_TYPES } from '../../../sellers/promotions/types/promotion.types.js';
import {
  CAMEROON_REGIONS,
  SELLER_FULFILMENT_METHODS,
} from '../../seller-applications/types/seller-application.types.js';
import type { AddressDetails } from '../../addresses/types/address.types.js';
import type { StoreLocation } from '../../../sellers/store/types/store.types.js';
import type {
  CheckoutFulfillmentSelection,
  CheckoutPromotionSnapshot,
} from '../../checkout/types/checkout-session.types.js';
import { PURCHASE_STATUSES } from '../../purchases/types/purchase.types.js';
import type { Order, OrderLineSnapshot } from '../types/order.types.js';

const orderPromotionSnapshotSchema = new Schema<CheckoutPromotionSnapshot>(
  {
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: PROMOTION_TYPES, required: true },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
  },
  { _id: false },
);

const orderLineSnapshotSchema = new Schema<OrderLineSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
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
    promotion: { type: orderPromotionSnapshotSchema, default: null },
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

const orderAddressSnapshotSchema = new Schema<AddressDetails>(
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

const orderCollectionLocationSchema = new Schema<StoreLocation>(
  {
    region: { type: String, enum: CAMEROON_REGIONS, required: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderFulfillmentSnapshotSchema = new Schema<CheckoutFulfillmentSelection>(
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
      type: orderAddressSnapshotSchema,
      default: null,
    },
    collectionLocation: {
      type: orderCollectionLocationSchema,
      default: null,
    },
  },
  { _id: false },
);

const orderSchema = new Schema<Order>(
  {
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
    },
    checkoutSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'CheckoutSession',
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    storeName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: PURCHASE_STATUSES,
      required: true,
      default: 'pending_payment',
    },
    lines: {
      type: [orderLineSnapshotSchema],
      required: true,
      validate: (lines: OrderLineSnapshot[]) => lines.length > 0,
    },
    fulfillment: {
      type: orderFulfillmentSnapshotSchema,
      required: true,
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
    fulfillmentFee: {
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
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevents duplicate seller orders if confirmation is retried.
orderSchema.index(
  { checkoutSessionId: 1, sellerId: 1 },
  { unique: true, name: 'unique_seller_order_per_checkout_session' },
);
orderSchema.index({ purchaseId: 1, createdAt: 1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

export const OrderModel = mongoose.models.Order ?? mongoose.model<Order>('Order', orderSchema);
