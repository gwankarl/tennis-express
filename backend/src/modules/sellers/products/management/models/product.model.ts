import mongoose, { Schema } from 'mongoose';

import {
  PRODUCT_CONDITIONS,
  PRODUCT_MODERATION_STATUSES,
  PRODUCT_PUBLICATION_STATUSES,
  type ProductOptionDefinition,
  type Product,
} from '../types/product.types.js';

const ProductImageSchema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true,
    },
    altText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Image sort order must be an integer.',
      },
    },
  },
  {
    timestamps: false,
  },
);

const ProductOptionDefinitionSchema = new Schema<ProductOptionDefinition>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    values: {
      type: [String],
      required: true,
      validate: {
        validator(values: string[]) {
          const normalizedValues = values.map((value) => value.trim().toLowerCase());
          return (
            values.length > 0 &&
            values.every((value) => value.trim().length > 0) &&
            new Set(normalizedValues).size === normalizedValues.length
          );
        },
        message: 'Option values must be nonempty and unique.',
      },
    },
  },
  { _id: false },
);

const ProductSchema = new Schema<Product>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // These fields can be completed after the draft is created.
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 180,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    description: {
      type: String,
      trim: true,
      minlength: 10,
      maxlength: 10000,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    condition: {
      type: String,
      enum: PRODUCT_CONDITIONS,
    },

    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    images: {
      type: [ProductImageSchema],
      default: [],
      validate: {
        validator(images: Array<{ isPrimary?: boolean }>) {
          return images.filter((image) => image.isPrimary).length <= 1;
        },
        message: 'A product can have at most one primary image.',
      },
    },

    options: {
      type: [ProductOptionDefinitionSchema],
      default: [],
      validate: {
        validator(options: ProductOptionDefinition[]) {
          const normalizedNames = options.map((option) => option.name.trim().toLowerCase());
          return new Set(normalizedNames).size === normalizedNames.length;
        },
        message: 'Product option names must be unique.',
      },
    },

    moderationStatus: {
      type: String,
      enum: PRODUCT_MODERATION_STATUSES,
      default: 'not_submitted',
      required: true,
    },
    publicationStatus: {
      type: String,
      enum: PRODUCT_PUBLICATION_STATUSES,
      default: 'draft',
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// A seller may have many drafts without a slug.
// Slugs must be unique within a storefront when assigned.
ProductSchema.index(
  { storeId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $type: 'string' },
    },
  },
);

ProductSchema.index({
  sellerId: 1,
  createdAt: -1,
});

ProductSchema.index({
  moderationStatus: 1,
  publicationStatus: 1,
  createdAt: -1,
});

export const ProductModel =
  mongoose.models.Product || mongoose.model<Product>('Product', ProductSchema);
