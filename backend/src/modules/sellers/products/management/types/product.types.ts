import type { Types } from 'mongoose';

export const PRODUCT_CONDITIONS = ['new', 'used'] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const PRODUCT_MODERATION_STATUSES = [
  'not_submitted',
  'pending',
  'approved',
  'rejected',
  'changes_requested',
] as const;
export type ProductModerationStatus = (typeof PRODUCT_MODERATION_STATUSES)[number];

export const PRODUCT_MODERATION_ACTIONS = [
  'submitted',
  'resubmitted',
  'approved',
  'rejected',
  'changes_requested',
] as const;

export type ProductModerationAction = (typeof PRODUCT_MODERATION_ACTIONS)[number];

/** Records a submission or moderation decision and the user who performed it. */
export interface ProductModerationEvent {
  action: ProductModerationAction;
  actorId: Types.ObjectId;
  reason: string | null;
  createdAt: Date;
}

export const PRODUCT_PUBLICATION_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductPublicationStatus = (typeof PRODUCT_PUBLICATION_STATUSES)[number];

/** A selectable option and its allowed values for a product. */
export interface ProductOptionDefinition {
  name: string;
  values: string[];
}

export interface ProductImage {
  _id: Types.ObjectId;
  publicId: string;
  secureUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

/** Image fields prepared by the server before Mongoose assigns its subdocument ID. */
export type ProductImageInput = Omit<ProductImage, '_id'>;

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

  submittedAt: Date | null;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  moderationReason: string | null;
  moderationHistory: ProductModerationEvent[];
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
