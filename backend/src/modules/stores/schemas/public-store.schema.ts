import { z } from 'zod';
import type { z as ZodTypes } from 'zod';

import { paginationQuerySchema } from '../../../shared/pagination.js';

export const listPublicStoresQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(150).optional(),
  location: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(['name_asc', 'newest']).default('name_asc'),
});

export const publicStoreSlugParamsSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Enter a valid store slug.'),
  })
  .strict();

export type PublicStoreSlugParams = ZodTypes.infer<typeof publicStoreSlugParamsSchema>;

export type ListPublicStoresQuery = z.output<typeof listPublicStoresQuerySchema>;
