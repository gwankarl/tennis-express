import type { Types } from 'mongoose';

import type { PaginationMetadata } from '../../../../shared/pagination.js';
import type { PublicProductCard } from '../../../products/types/public-product.types.js';

/** A product saved by one user in their wishlist. */
export interface WishlistItem {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  addedAt: Date;
}

/** A saved wishlist entry, including its current public product card when visible. */
export interface WishlistEntry {
  productId: string;
  addedAt: Date;
  product: PublicProductCard | null;
}

/** A page of the authenticated user's wishlist. */
export interface WishlistListResult {
  items: WishlistEntry[];
  pagination: PaginationMetadata;
}

/** Result of adding a wishlist item. */
export interface AddWishlistItemResult {
  item: {
    productId: string;
    addedAt: Date;
  };
  created: boolean;
}

/** Indicates whether a product is saved by the authenticated user. */
export interface WishlistStatusResult {
  isWishlisted: boolean;
}
