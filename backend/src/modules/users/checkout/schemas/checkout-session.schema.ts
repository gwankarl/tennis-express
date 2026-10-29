import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

/** Validates the cart lines selected to start checkout. */
export const createCheckoutSessionSchema = z
  .object({
    cartItemIds: z
      .array(objectIdSchema)
      .min(1, 'Select at least one cart item.')
      .refine((itemIds) => new Set(itemIds).size === itemIds.length, {
        message: 'Cart item IDs must be unique.',
      }),
  })
  .strict();

export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionSchema>;

export const checkoutSessionIdParamsSchema = z
  .object({
    sessionId: objectIdSchema,
  })
  .strict();

export type CheckoutSessionIdParams = z.infer<typeof checkoutSessionIdParamsSchema>;
