import { z } from 'zod';

const productIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

export const addWishlistItemSchema = z.object({
  productId: productIdSchema,
});

export type AddWishlistItemRequest = z.output<typeof addWishlistItemSchema>;

export const wishlistProductIdParamsSchema = z.object({
  productId: productIdSchema,
});

export type WishlistProductIdParams = z.output<typeof wishlistProductIdParamsSchema>;
