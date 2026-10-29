import { z } from 'zod';

/** Validates pagination for the authenticated customer's purchase list. */
export const listPurchasesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ListPurchasesQuery = z.infer<typeof listPurchasesQuerySchema>;

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

export const purchaseIdParamsSchema = z
  .object({
    purchaseId: objectIdSchema,
  })
  .strict();

export type PurchaseIdParams = z.infer<typeof purchaseIdParamsSchema>;
