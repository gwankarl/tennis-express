import mongoose from 'mongoose';

import { buildPublicProductAttributeMatch } from './public-product-attribute-filter.helper.js';
import type { ListPublicProductsQuery } from '../schemas/public-product.schema.js';

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchMatch(query: string | undefined): Record<string, unknown> {
  if (!query) return {};

  const terms = query.split(/\s+/).filter(Boolean);

  return {
    $and: terms.map((term) => {
      const expression = {
        $regex: escapeRegularExpression(term),
        $options: 'i',
      };

      return {
        $or: [{ name: expression }, { description: expression }],
      };
    }),
  };
}

/** Builds filters that can be applied directly to public product fields. */
export async function buildPublicProductQueryMatch(
  query: ListPublicProductsQuery,
): Promise<Record<string, unknown>> {
  const attributeMatch = await buildPublicProductAttributeMatch(
    query.categoryId,
    query.attributeFilters,
  );

  return {
    ...buildSearchMatch(query.q),
    ...(query.categoryId ? { categoryId: new mongoose.Types.ObjectId(query.categoryId) } : {}),
    ...(query.brandId ? { brandId: new mongoose.Types.ObjectId(query.brandId) } : {}),
    ...(query.condition ? { condition: query.condition } : {}),
    ...(query.sellerId ? { sellerId: new mongoose.Types.ObjectId(query.sellerId) } : {}),
    ...attributeMatch,
  };
}
