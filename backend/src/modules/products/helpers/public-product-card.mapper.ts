import type { Types } from 'mongoose';

import type { PublicProductCard } from '../types/public-product.types.js';
import type { ProductCondition } from '../../sellers/products/management/types/product.types.js';

interface PublicProductAggregateRow {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  condition: ProductCondition;
  images: Array<{
    secureUrl: string;
    altText: string;
    isPrimary: boolean;
  }>;
  eligibleStore: Array<{
    _id: Types.ObjectId | string;
    name: string;
    slug: string;
  }>;
  variantSummary: Array<{
    minPrice: number;
    maxPrice: number;
    hasStock: number;
  }>;
}

/**
 * Maps one visible product aggregation row to the public product-card contract.
 */
export function mapPublicProductCard(product: PublicProductAggregateRow): PublicProductCard {
  const store = product.eligibleStore[0];
  const variantSummary = product.variantSummary[0];
  const primaryImage = product.images.find((image) => image.isPrimary);

  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    price: {
      min: variantSummary.minPrice,
      max: variantSummary.maxPrice,
      currency: 'XAF',
    },
    primaryImage: primaryImage
      ? {
          secureUrl: primaryImage.secureUrl,
          altText: primaryImage.altText,
        }
      : null,
    condition: product.condition,
    availability: variantSummary.hasStock > 0 ? 'in_stock' : 'out_of_stock',
    store: {
      id: String(store._id),
      name: store.name,
      slug: store.slug,
    },
  };
}

/** Maps the rows returned in the aggregation's `products` facet. */
export function mapPublicProductCards(products: PublicProductAggregateRow[]): PublicProductCard[] {
  return products.map(mapPublicProductCard);
}
