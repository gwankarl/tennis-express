import type { ListPublicStoresQuery } from '../schemas/public-store.schema.js';

type PublicStoreListCondition =
  | {
      $or: Array<{ name: RegExp } | { description: RegExp }>;
    }
  | {
      $or: Array<{ 'location.city': RegExp } | { 'location.region': RegExp }>;
    };

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Builds escaped search and location filters for active public storefronts. */
export function buildPublicStoreListFilter(input: ListPublicStoresQuery) {
  const conditions: PublicStoreListCondition[] = [];

  if (input.q) {
    const searchPattern = new RegExp(escapeRegularExpression(input.q), 'i');

    conditions.push({
      $or: [{ name: searchPattern }, { description: searchPattern }],
    });
  }

  if (input.location) {
    const locationPattern = new RegExp(escapeRegularExpression(input.location), 'i');

    conditions.push({
      $or: [{ 'location.city': locationPattern }, { 'location.region': locationPattern }],
    });
  }

  return {
    status: 'active' as const,
    ...(conditions.length > 0 ? { $and: conditions } : {}),
  };
}

/** Selects a stable sort order for the public store directory. */
export function buildPublicStoreListSort(
  sort: ListPublicStoresQuery['sort'],
): Record<string, 1 | -1> {
  return sort === 'newest' ? { createdAt: -1, _id: -1 } : { name: 1, _id: 1 };
}
