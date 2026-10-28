import { z } from 'zod'

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID.')

const localDateTimeSchema = z
  .string()
  .min(1, 'Choose a date and time.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Enter a valid date and time.')

export const sellerPromotionFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Promotion name must be at least 2 characters.')
      .max(120, 'Promotion name cannot exceed 120 characters.'),
    eligibleProductIds: z
      .array(objectIdSchema)
      .min(1, 'Select at least one product.')
      .refine(
        (productIds) =>
          new Set(productIds.map((productId) => productId.toLowerCase())).size ===
          productIds.length,
        'A product can only be selected once.',
      ),
    discountType: z.enum(['percentage', 'fixed_amount']),
    discountValue: z
      .number()
      .int('Enter a whole number.')
      .min(1, 'Discount value must be at least 1.')
      .max(Number.MAX_SAFE_INTEGER, 'Discount value is too large.'),
    startsAt: localDateTimeSchema,
    endsAt: localDateTimeSchema,
  })
  .superRefine((values, context) => {
    if (values.discountType === 'percentage' && values.discountValue > 90) {
      context.addIssue({
        code: 'custom',
        path: ['discountValue'],
        message: 'Percentage discounts cannot exceed 90%.',
      })
    }

    const startsAt = new Date(values.startsAt).getTime()
    const endsAt = new Date(values.endsAt).getTime()

    if (!Number.isNaN(startsAt) && !Number.isNaN(endsAt) && startsAt >= endsAt) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'The end date and time must be later than the start.',
      })
    }

    if (!Number.isNaN(endsAt) && endsAt <= Date.now()) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'The end date and time must be in the future.',
      })
    }
  })

export type SellerPromotionFormValues = z.infer<typeof sellerPromotionFormSchema>
