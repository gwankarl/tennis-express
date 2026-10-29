import mongoose, { Schema } from 'mongoose';

import type { Cart, CartItem } from '../types/cart.types.js';

const cartItemSchema = new Schema<CartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
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
    validate: {
      validator: Number.isSafeInteger,
      message: 'Cart quantity must be a positive safe integer.',
    },
  },
  addedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // Keep Mongoose's default embedded _id for later item-level routes.
});

const cartSchema = new Schema<Cart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [cartItemSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Enforces one cart per user.
cartSchema.index({ userId: 1 }, { unique: true, name: 'unique_cart_per_user' });

export const CartModel = mongoose.models.Cart ?? mongoose.model<Cart>('Cart', cartSchema);
