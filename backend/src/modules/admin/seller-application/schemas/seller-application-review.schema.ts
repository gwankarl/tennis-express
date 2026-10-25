import { z } from 'zod';

import { paginationQuerySchema } from '../../../../shared/pagination.js';
import { SELLER_APPLICATION_STATUSES } from '../../../users/seller-applications/types/seller-application.types.js';

export const applicationIdParamsSchema = z
  .object({
    applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID.'),
  })
  .strict();

export const adminSellerApplicationsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(SELLER_APPLICATION_STATUSES),
});

export const rejectSellerApplicationSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(20, 'The rejection reason must contain at least 20 characters.')
      .max(1000, 'The rejection reason must not exceed 1000 characters.'),
  })
  .strict();
