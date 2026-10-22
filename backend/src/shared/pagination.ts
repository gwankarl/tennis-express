import { z } from 'zod';

/**
 * Validates pagination query parameters and supplies defaults when omitted.
 * Page numbers start at 1; page size defaults to 20 and is capped at 100.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.output<typeof paginationQuerySchema>;

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculates the number of records to skip in a paginated database query.
 */
export function getPaginationOffset({ page, limit }: PaginationQuery): number {
  return (page - 1) * limit;
}

/**
 * Builds response metadata from validated pagination values and a database count.
 */
export function buildPaginationMetadata(
  { page, limit }: PaginationQuery,
  totalItems: number,
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}
