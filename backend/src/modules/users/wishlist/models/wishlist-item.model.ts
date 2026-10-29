import mongoose, { Schema } from 'mongoose';

import type { WishlistItem } from '../types/wishlist.types.js';

const wishlistItemSchema = new Schema<WishlistItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      immutable: true,
    },
    addedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
    collection: 'wishlistitems',
  },
);

wishlistItemSchema.index(
  { userId: 1, productId: 1 },
  {
    unique: true,
    name: 'unique_user_wishlist_product',
  },
);

wishlistItemSchema.index(
  { userId: 1, addedAt: -1, _id: -1 },
  {
    name: 'wishlist_user_items_added_at',
  },
);

export const WishlistItemModel =
  mongoose.models.WishlistItem ??
  mongoose.model<WishlistItem>('WishlistItem', wishlistItemSchema);
