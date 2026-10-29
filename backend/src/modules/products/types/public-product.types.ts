import type { PaginationMetadata } from '../../../shared/pagination.js';
import type { CategoryAttributeType } from '../../admin/categories/types/category.types.js';
import type {
  ProductCondition,
  ProductOptionDefinition,
} from '../../sellers/products/management/types/product.types.js';

export const PUBLIC_PRODUCT_AVAILABILITY_OPTIONS = ['in_stock', 'out_of_stock'] as const;

export type PublicProductAvailability = (typeof PUBLIC_PRODUCT_AVAILABILITY_OPTIONS)[number];

export const PUBLIC_PRODUCT_SORT_OPTIONS = ['newest', 'price_asc', 'price_desc'] as const;

export type PublicProductSortOption = (typeof PUBLIC_PRODUCT_SORT_OPTIONS)[number];

export interface PublicProductCard {
  id: string;
  name: string;
  slug: string;
  price: {
    min: number;
    max: number;
    currency: 'XAF';
  };
  primaryImage: {
    secureUrl: string;
    altText: string;
  } | null;
  condition: ProductCondition;
  availability: PublicProductAvailability;
  store: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface PublicProductDetailImage {
  id: string;
  secureUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PublicProductDetailVariant {
  id: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  isDefault: boolean;
  availability: PublicProductAvailability;
}

export interface PublicProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  condition: ProductCondition;
  attributes: Record<string, unknown>;
  images: PublicProductDetailImage[];
  options: ProductOptionDefinition[];
  price: {
    min: number;
    max: number;
    currency: 'XAF';
  };
  availability: PublicProductAvailability;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: PublicProductDetailVariant[];
  store: {
    id: string;
    name: string;
    slug: string;
    logo: {
      secureUrl: string;
    } | null;
    location: {
      region: string;
      city: string;
    };
  };
  publishedAt: Date | null;
}

export interface PublicProductListResult {
  products: PublicProductCard[];
  pagination: PaginationMetadata;
}

export interface PublicProductFilterAttribute {
  name: string;
  slug: string;
  type: CategoryAttributeType;
  required: boolean;
  options: string[];
}

export interface PublicProductFilterMetadata {
  brands: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  conditions: ProductCondition[];
  priceRange: {
    min: number;
    max: number;
    currency: 'XAF';
  } | null;
  availabilityOptions: PublicProductAvailability[];
  sortOptions: PublicProductSortOption[];
  attributes: PublicProductFilterAttribute[];
}
