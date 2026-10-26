import { z } from 'zod';

import { paginationQuerySchema } from '../../../../shared/pagination.js';
import { STORE_STATUSES } from '../../../sellers/store/types/store.types.js';

export const adminStoreListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(STORE_STATUSES).optional(),
});

export type AdminStoreListQuery = z.output<typeof adminStoreListQuerySchema>;

export const adminStoreIdParamsSchema = z
  .object({
    storeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.'),
  })
  .strict();

export const adminStoreStatusSchema = z
  .object({
    status: z.enum(STORE_STATUSES),
  })
  .strict();

export type AdminStoreStatusRequest = z.infer<typeof adminStoreStatusSchema>;

export type AdminStoreIdParams = z.infer<typeof adminStoreIdParamsSchema>;
