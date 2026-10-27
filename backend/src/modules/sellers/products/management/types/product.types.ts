import type { Types } from 'mongoose';

export const PRODUCT_CONDITIONS = ['new', 'used'] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const PRODUCT_MODERATION_STATUSES = [
  'not_submitted',
  'pending',
  'approved',
  'rejected',
] as const;
export type ProductModerationStatus = (typeof PRODUCT_MODERATION_STATUSES)[number];

export const PRODUCT_PUBLICATION_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductPublicationStatus = (typeof PRODUCT_PUBLICATION_STATUSES)[number];

/** A selectable option and its allowed values for a product. */
export interface ProductOptionDefinition {
  name: string;
  values: string[];
}

export interface ProductImage {
  _id?: Types.ObjectId;
  publicId: string;
  secureUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  sellerId: Types.ObjectId;

  // Optional while a product is an incomplete draft.
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: Types.ObjectId;
  brandId?: Types.ObjectId | null;
  condition?: ProductCondition;

  attributes: Record<string, unknown>;
  images: ProductImage[];

  options: ProductOptionDefinition[];
  moderationStatus: ProductModerationStatus;
  publicationStatus: ProductPublicationStatus;

  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

/**
 * Fields accepted when creating a draft.
 * Ownership and workflow status are assigned by the server.
 */
export interface CreateProductDraftInput {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string | null;
  condition?: ProductCondition;
  options?: ProductOptionDefinition[];
  attributes?: Record<string, unknown>;
}

/**
 * Fields a seller may edit on an existing product.
 * Ownership, moderation and publication status are excluded.
 */
export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string | null;
  condition?: ProductCondition;
  options?: ProductOptionDefinition[];
  attributes?: Record<string, unknown>;
}
