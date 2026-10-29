import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

/** Validates the product variant and quantity being added to a cart. */
export const addCartItemSchema = z
  .object({
    productId: objectIdSchema,
    variantId: objectIdSchema,
    quantity: z
      .number()
      .int()
      .min(1)
      .refine(Number.isSafeInteger, 'Quantity must be a positive safe integer.'),
  })
  .strict();

export type AddCartItemRequest = z.infer<typeof addCartItemSchema>;

export const cartItemIdParamsSchema = z
  .object({
    itemId: objectIdSchema,
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z
      .number()
      .int()
      .min(1)
      .refine(Number.isSafeInteger, 'Quantity must be a positive safe integer.'),
  })
  .strict();

export type CartItemIdParams = z.infer<typeof cartItemIdParamsSchema>;
export type UpdateCartItemRequest = z.infer<typeof updateCartItemSchema>;
