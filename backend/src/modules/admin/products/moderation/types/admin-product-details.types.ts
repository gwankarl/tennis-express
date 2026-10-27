import type { CategoryAttribute } from '../../../categories/types/category.types.js';
import type { BrandStatus } from '../../../brands/types/brand.types.js';
import type {
  ProductCondition,
  ProductModerationAction,
  ProductModerationStatus,
  ProductOptionDefinition,
  ProductPublicationStatus,
} from '../../../../sellers/products/management/types/product.types.js';
import type { ProductVariantStatus } from '../../../../sellers/products/variants/types/product-variant.types.js';
import type { StoreStatus } from '../../../../sellers/store/types/store.types.js';
import type { UserStatus } from '../../../../users/profiles/types/user.types.js';

/** Publicly relevant product image fields for administrator review. */
export interface AdminProductReviewImage {
  secureUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

/** A moderation history event without database-specific ID objects. */
export interface AdminProductReviewHistoryEvent {
  action: ProductModerationAction;
  actorId: string;
  reason: string | null;
  createdAt: Date;
}

/** Product fields required to review a submitted listing. */
export interface AdminProductReviewProduct {
  id: string;
  sellerId: string;
  storeId: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  categoryId: string | null;
  brandId: string | null;
  condition: ProductCondition | null;
  attributes: Record<string, unknown>;
  images: AdminProductReviewImage[];
  options: ProductOptionDefinition[];
  moderationStatus: ProductModerationStatus;
  publicationStatus: ProductPublicationStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  submittedAt: Date | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  moderationReason: string | null;
  moderationHistory: AdminProductReviewHistoryEvent[];
}

/** Limited seller account details useful for moderation. */
export interface AdminProductReviewSeller {
  id: string;
  userName: string;
  status: UserStatus;
}

/** Limited storefront details useful for moderation. */
export interface AdminProductReviewStore {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
}

/** Limited category details, including the submitted attribute definitions. */
export interface AdminProductReviewCategory {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  attributes: Pick<CategoryAttribute, 'name' | 'slug' | 'type' | 'required' | 'options'>[];
}

/** Limited brand details useful for moderation. */
export interface AdminProductReviewBrand {
  id: string;
  name: string;
  slug: string;
  status: BrandStatus;
}

/** Complete administrator product review response. */
export interface AdminProductDetails {
  product: AdminProductReviewProduct;
  seller: AdminProductReviewSeller | null;
  store: AdminProductReviewStore | null;
  category: AdminProductReviewCategory | null;
  brand: AdminProductReviewBrand | null;
  variants: {
    id: string;
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
  }[];
}
