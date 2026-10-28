import { z } from 'zod'

import type { ProductOptionDefinition } from '../../types'

const sellerProductVariantFormFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Enter a variant name.').max(120),
  sku: z.string().trim(),
  price: z
    .number()
    .int('Enter a whole-number price.')
    .min(1, 'Price must be at least 1.')
    .refine(Number.isSafeInteger, 'Enter a valid price.'),
  stockQuantity: z
    .number()
    .int('Enter a whole-number stock quantity.')
    .min(0, 'Stock quantity cannot be negative.')
    .refine(Number.isSafeInteger, 'Enter a valid stock quantity.'),
  optionValues: z.array(z.string()),
})

/** Builds variant validation from the product's configured options. */
export function createSellerProductVariantFormSchema(options: ProductOptionDefinition[]) {
  return sellerProductVariantFormFieldsSchema.superRefine((values, context) => {
    if (values.optionValues.length !== options.length) {
      context.addIssue({
        code: 'custom',
        path: ['optionValues'],
        message: 'The product options changed. Reload the editor and try again.',
      })
      return
    }

    options.forEach((option, index) => {
      const selectedValue = values.optionValues[index]

      if (!selectedValue) {
        context.addIssue({
          code: 'custom',
          path: ['optionValues', index],
          message: `Choose a value for ${option.name}.`,
        })
      } else if (!option.values.includes(selectedValue)) {
        context.addIssue({
          code: 'custom',
          path: ['optionValues', index],
          message: `Choose a valid value for ${option.name}.`,
        })
      }
    })
  })
}

export type SellerProductVariantFormValues = z.infer<typeof sellerProductVariantFormFieldsSchema>
