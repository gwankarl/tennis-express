import { z } from 'zod';

import {
  CAMEROON_REGIONS,
  SELLER_DISPATCH_TIMES,
  SELLER_FULFILMENT_METHODS,
} from '../../../users/seller-applications/types/seller-application.types.js';
import { STORE_STATUSES } from '../types/store.types.js';

/** Validates the location fields that can be updated on a storefront. */
const storeLocationSchema = z
  .object({
    region: z.enum(CAMEROON_REGIONS),
    city: z.string().trim().min(1).max(100),
    address: z.string().trim().min(1).max(300),
  })
  .strict();

/** Validates one seller-defined delivery or collection option. */
const storeOptionSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    fee: z
      .number()
      .int()
      .min(0)
      .refine(Number.isSafeInteger, 'Fee must be a nonnegative safe integer in XAF.'),
  })
  .strict();

/** Validates an updated fulfilment profile using the application’s shared enums. */
const storeFulfilmentProfileSchema = z
  .object({
    methods: z.array(z.enum(SELLER_FULFILMENT_METHODS)).min(1).max(2),
    serviceRegions: z.array(z.enum(CAMEROON_REGIONS)).min(1).max(10),
    dispatchTime: z.enum(SELLER_DISPATCH_TIMES),
  })
  .strict();

/** Validates the optional return policy stored on a storefront. */
const storeReturnPolicySchema = z
  .object({
    summary: z.string().trim().min(1),
    returnWindowDays: z.number().finite().min(0),
    conditions: z.array(z.string().trim().min(1)),
  })
  .strict();

export const updateSellerStoreSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    fulfilmentProfile: storeFulfilmentProfileSchema.nullable().optional(),
    location: storeLocationSchema.optional(),
    deliveryOptions: z.array(storeOptionSchema).optional(),
    collectionOptions: z.array(storeOptionSchema).optional(),
    returnPolicy: storeReturnPolicySchema.nullable().optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Provide at least one storefront field to update.',
  });

export type UpdateSellerStoreRequest = z.infer<typeof updateSellerStoreSchema>;

/** Validates a request to activate or pause the authenticated seller's store. */
export const updateSellerStoreStatusSchema = z
  .object({
    status: z.enum(STORE_STATUSES),
  })
  .strict();

export type UpdateSellerStoreStatusRequest = z.infer<typeof updateSellerStoreStatusSchema>;
