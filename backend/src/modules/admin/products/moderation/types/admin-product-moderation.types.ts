import type {
  ProductCondition,
  ProductImage,
  ProductModerationStatus,
} from '../../../../sellers/products/management/types/product.types.js';

/** Product summary fields shown in the administrator moderation list. */
export interface AdminProductListItem {
  id: string;
  sellerId: string;
  storeId: string;
  name?: string;
  slug?: string;
  categoryId?: string;
  brandId: string | null;
  condition?: ProductCondition;
  moderationStatus: Exclude<ProductModerationStatus, 'not_submitted'>;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  primaryImage: Pick<ProductImage, 'secureUrl' | 'altText'> | null;
}
