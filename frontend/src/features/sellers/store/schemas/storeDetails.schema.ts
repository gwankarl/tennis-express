import { z } from 'zod'

import { sellerDispatchTimes, sellerFulfilmentMethods, sellerStoreRegions } from '../types'

const optionSchema = z.object({
  name: z.string().trim().min(1, 'Enter an option name.'),
  description: z.string().trim().min(1, 'Enter a description.'),
  fee: z.number().finite().min(0, 'The fee cannot be negative.'),
})

/** Validates all seller-editable storefront fields. */
export const storeDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a store name.')
    .max(100, 'Store names must not exceed 100 characters.'),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a store description.')
    .max(2000, 'Descriptions must not exceed 2,000 characters.'),
  location: z.object({
    region: z.enum(sellerStoreRegions),
    city: z.string().trim().min(1, 'Enter a city or town.').max(100),
    address: z.string().trim().min(1, 'Enter an operating address.').max(300),
  }),
  fulfilmentProfile: z.object({
    methods: z.array(z.enum(sellerFulfilmentMethods)).min(1).max(2),
    serviceRegions: z.array(z.enum(sellerStoreRegions)).min(1).max(10),
    dispatchTime: z.enum(sellerDispatchTimes),
  }),
  deliveryOptions: z.array(optionSchema),
  collectionOptions: z.array(optionSchema),
  returnPolicy: z.object({
    summary: z.string().trim(),
    returnWindowDays: z.number().finite().min(0),
    conditionsText: z.string(),
  }),
})

export type StoreDetailsFormValues = z.infer<typeof storeDetailsSchema>
