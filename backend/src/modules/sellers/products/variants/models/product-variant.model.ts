import mongoose, { Schema } from 'mongoose';

import { PRODUCT_VARIANT_STATUSES, type ProductVariant } from '../types/product-variant.types.js';

const ProductVariantSchema = new Schema<ProductVariant>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },

    attributes: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Price must be a positive safe integer.',
      },
    },

    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Stock quantity must be a nonnegative safe integer.',
      },
    },

    configurationKey: {
      type: String,
      required: true,
      trim: true,
    },

    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: PRODUCT_VARIANT_STATUSES,
      required: true,
      default: 'active',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Allows fast retrieval of variants belonging to a product.
ProductVariantSchema.index({
  productId: 1,
  status: 1,
});

// Prevent duplicate non-null SKUs within the same product.
ProductVariantSchema.index(
  { productId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sku: { $type: 'string' },
    },
  },
);

// Prevent two variants for a product from having the same option configuration.
ProductVariantSchema.index({ productId: 1, configurationKey: 1 }, { unique: true });

// A product can have at most one explicitly designated default variant.
ProductVariantSchema.index(
  { productId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  },
);

export const ProductVariantModel =
  mongoose.models.ProductVariant ||
  mongoose.model<ProductVariant>('ProductVariant', ProductVariantSchema);
