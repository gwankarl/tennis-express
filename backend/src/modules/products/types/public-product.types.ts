import type { ProductCondition } from '../../sellers/products/management/types/product.types.js';

export interface PublicProductCard {
  id: string;
  name: string;
  slug: string;
  condition: ProductCondition;
  primaryImage: {
    secureUrl: string;
    altText: string;
  } | null;
  priceRange: {
    min: number;
    max: number;
  };
  availability: 'in_stock' | 'out_of_stock';
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
