import type { Types } from 'mongoose';
import type { PublicProductCard } from '../../../products/types/public-product.types.js';
import type { PromotionType } from '../../../sellers/promotions/types/promotion.types.js';

export interface CartItemView {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  addedAt: Date;
  product: PublicProductCard | null;
  variant: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
  } | null;
  isAvailable: boolean;
}

export interface CartView {
  id: string | null;
  items: CartItemView[];
  lineCount: number;
  totalQuantity: number;
}

/** One product variant and quantity saved in a user's cart. */
export interface CartItem {
  /** Stable embedded ID used by later cart-item update and delete endpoints. */
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

/** A user's cart. Prices are intentionally read from current product data. */
export interface Cart {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type CartValidationIssueCode =
  'PRODUCT_OR_SELLER_UNAVAILABLE' | 'VARIANT_UNAVAILABLE' | 'INSUFFICIENT_STOCK';

export interface CartValidationIssue {
  code: CartValidationIssueCode;
  message: string;
}

export interface CartValidationLine {
  cartItemId: string;
  productId: string;
  variantId: string;
  productName: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number | null;
  appliedPromotion: {
    id: string;
    name: string;
    type: PromotionType;
    discountAmount: number;
  } | null;
  lineSubtotal: number | null;
  lineDiscount: number;
  lineTotal: number | null;
  issues: CartValidationIssue[];
}

export interface CartValidationResult {
  cartId: string | null;
  currency: 'XAF';
  canCheckout: boolean;
  lines: CartValidationLine[];
  totals: {
    subtotal: number;
    discount: number;
    total: number;
  };
}
