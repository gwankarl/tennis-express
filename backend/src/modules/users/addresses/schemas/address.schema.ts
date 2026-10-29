import { z } from 'zod';

/** Validates the details required to save a customer delivery address. */
export const createAddressSchema = z
  .object({
    recipientName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(30),
    region: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(100),
    neighborhood: z.string().trim().min(1).max(120),
    street: z.string().trim().min(1).max(200),
    deliveryInstructions: z.string().trim().max(500).nullable().optional(),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export type CreateAddressRequest = z.infer<typeof createAddressSchema>;

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId.');

export const addressIdParamsSchema = z
  .object({
    addressId: objectIdSchema,
  })
  .strict();

export const updateAddressSchema = z
  .object({
    recipientName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(30),
    region: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(100),
    neighborhood: z.string().trim().min(1).max(120),
    street: z.string().trim().min(1).max(200),
    deliveryInstructions: z.string().trim().max(500).nullable(),
    isDefault: z.boolean(),
  })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'Provide at least one address field to update.',
  });

export type AddressIdParams = z.infer<typeof addressIdParamsSchema>;
export type UpdateAddressRequest = z.infer<typeof updateAddressSchema>;
