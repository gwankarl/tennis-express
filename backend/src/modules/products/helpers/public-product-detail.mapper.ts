import type { Types } from 'mongoose';

import type {
  PublicProductDetail,
  PublicProductDetailVariant,
} from '../types/public-product.types.js';

export interface PublicProductDetailAggregateRow extends Omit<
  PublicProductDetail,
  'id' | 'images' | 'variants' | 'store'
> {
  _id: Types.ObjectId | string;
  images: PublicProductDetail['images'];
  variants: PublicProductDetailVariant[];
  store: {
    _id: Types.ObjectId | string;
    name: string;
    slug: string;
    logo?: {
      secureUrl?: string | null;
    } | null;
    location: {
      region: string;
      city: string;
    };
  };
}

/** Maps one visibility-checked aggregation row to the public detail response. */
export function mapPublicProductDetail(
  product: PublicProductDetailAggregateRow,
): PublicProductDetail {
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description,
    condition: product.condition,
    attributes: product.attributes,
    images: [...product.images].sort((first, second) => first.sortOrder - second.sortOrder),
    options: product.options,
    price: product.price,
    availability: product.availability,
    category: product.category,
    brand: product.brand,
    variants: product.variants,
    store: {
      id: String(product.store._id),
      name: product.store.name,
      slug: product.store.slug,
      logo: product.store.logo?.secureUrl ? { secureUrl: product.store.logo.secureUrl } : null,
      location: {
        region: product.store.location.region,
        city: product.store.location.city,
      },
    },
    publishedAt: product.publishedAt,
  };
}
