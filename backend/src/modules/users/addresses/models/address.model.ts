import mongoose, { Schema } from 'mongoose';

import type { CustomerAddress } from '../types/address.types.js';

const addressSchema = new Schema<CustomerAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    neighborhood: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Supports listing a user's saved addresses with the default first.
addressSchema.index({ userId: 1, isDefault: -1, createdAt: -1 });

// A user may have at most one default saved address.
addressSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
    name: 'one_default_address_per_user',
  },
);

export const CustomerAddressModel =
  mongoose.models.CustomerAddress ??
  mongoose.model<CustomerAddress>('CustomerAddress', addressSchema);
