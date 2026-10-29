import { z } from 'zod';
import { CAMEROON_REGIONS } from '../../seller-applications/types/seller-application.types.js';

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

/** Validates the destination region used to find fulfillment options. */
export const fulfillmentOptionsQuerySchema = z
  .object({
    destinationRegion: z.enum(CAMEROON_REGIONS),
  })
  .strict();

export type FulfillmentOptionsQuery = z.infer<typeof fulfillmentOptionsQuerySchema>;

const deliveryAddressDetailsSchema = z
  .object({
    recipientName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(30),
    region: z.enum(CAMEROON_REGIONS),
    city: z.string().trim().min(1).max(100),
    neighborhood: z.string().trim().min(1).max(120),
    street: z.string().trim().min(1).max(200),
    deliveryInstructions: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

const deliveryAddressSelectionSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('saved'),
      addressId: objectIdSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('one_time'),
      address: deliveryAddressDetailsSchema,
    })
    .strict(),
]);

const checkoutFulfillmentGroupSchema = z.discriminatedUnion('method', [
  z
    .object({
      sellerId: objectIdSchema,
      method: z.literal('delivery'),
      optionName: z.string().trim().min(1),
      address: deliveryAddressSelectionSchema,
    })
    .strict(),
  z
    .object({
      sellerId: objectIdSchema,
      method: z.literal('collection'),
      optionName: z.string().trim().min(1),
    })
    .strict(),
]);

/** Validates fulfillment choices for one or more seller groups. */
export const updateCheckoutFulfillmentSchema = z
  .object({
    groups: z
      .array(checkoutFulfillmentGroupSchema)
      .min(1)
      .refine(
        (groups) => new Set(groups.map((group) => group.sellerId)).size === groups.length,
        'A seller group may only be selected once.',
      ),
  })
  .strict();

export type UpdateCheckoutFulfillmentRequest = z.infer<typeof updateCheckoutFulfillmentSchema>;

/** Validates the quote version the customer has reviewed and accepts. */
export const acknowledgeCheckoutChangesSchema = z
  .object({
    quoteVersion: z
      .number()
      .int()
      .min(1)
      .refine(Number.isSafeInteger, 'Quote version must be a safe integer.'),
  })
  .strict();

export type AcknowledgeCheckoutChangesRequest = z.infer<typeof acknowledgeCheckoutChangesSchema>;
