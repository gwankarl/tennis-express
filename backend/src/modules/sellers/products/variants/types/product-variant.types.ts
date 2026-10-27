import type { Types } from 'mongoose';

export const PRODUCT_VARIANT_STATUSES = ['active', 'inactive'] as const;

export type ProductVariantStatus = (typeof PRODUCT_VARIANT_STATUSES)[number];

export interface ProductVariant {
  _id: Types.ObjectId;
  productId: Types.ObjectId;

  name: string;
  attributes: Record<string, string>;
  configurationKey: string;
  isDefault: boolean;
  sku: string | null;

  price: number;
  stockQuantity: number;

  status: ProductVariantStatus;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductVariantInput {
  name: string;
  attributes?: Record<string, string>;
  sku?: string | null;
  price: number;
  stockQuantity: number;
}

export interface UpdateProductVariantInput {
  name?: string;
  attributes?: Record<string, string>;
  sku?: string | null;
  price?: number;
  stockQuantity?: number;
}

export interface UpdateProductVariantStatusInput {
  status: ProductVariantStatus;
}
