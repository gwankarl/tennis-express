import mongoose, { Schema } from 'mongoose';

import {
  PRODUCT_ENGAGEMENT_EVENT_TYPES,
  type ProductEngagementEvent,
} from '../types/product-engagement.types.js';

const productEngagementEventSchema = new Schema<ProductEngagementEvent>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      immutable: true,
    },
    eventType: {
      type: String,
      enum: PRODUCT_ENGAGEMENT_EVENT_TYPES,
      required: true,
      immutable: true,
    },
    actorKey: {
      type: String,
      required: true,
      immutable: true,
    },
    viewDay: {
      type: String,
      default: undefined,
      immutable: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      immutable: true,
    },
  },
  {
    versionKey: false,
    collection: 'productengagementevents',
  },
);

productEngagementEventSchema.index(
  { productId: 1, actorKey: 1, viewDay: 1 },
  {
    unique: true,
    name: 'unique_product_view_by_actor_day',
    partialFilterExpression: { eventType: 'view' },
  },
);

productEngagementEventSchema.index(
  { eventType: 1, occurredAt: 1, productId: 1 },
  { name: 'product_engagement_popularity_lookup' },
);

productEngagementEventSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'product_engagement_expiry' },
);

export const ProductEngagementEventModel =
  mongoose.models.ProductEngagementEvent ??
  mongoose.model<ProductEngagementEvent>('ProductEngagementEvent', productEngagementEventSchema);
