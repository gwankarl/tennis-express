import { z } from 'zod'
import { productConditions } from '../types'

const conditionValues = ['', ...productConditions] as const

export const productDetailsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(150, 'Product names cannot exceed 150 characters.')
      .refine((value) => value.length === 0 || value.length >= 2, {
        message: 'Enter at least 2 characters, or leave the name blank for now.',
      }),
    description: z
      .string()
      .trim()
      .max(10000, 'Descriptions cannot exceed 10,000 characters.')
      .refine((value) => value.length === 0 || value.length >= 10, {
        message: 'Enter at least 10 characters, or leave the description blank for now.',
      }),
    categoryId: z.string(),
    brandId: z.string(),
    condition: z.enum(conditionValues),
    options: z.array(
      z.object({
        name: z.string(),
        valuesText: z.string(),
      }),
    ),
    attributes: z.record(z.string(), z.unknown()),
  })
  .superRefine((values, context) => {
    const usedNames = new Set<string>()

    values.options.forEach((option, index) => {
      const name = option.name.trim()
      const optionValues = option.valuesText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      if (!name && !option.valuesText.trim()) return

      if (!name) {
        context.addIssue({
          code: 'custom',
          path: ['options', index, 'name'],
          message: 'Enter an option name.',
        })
      } else if (usedNames.has(name.toLowerCase())) {
        context.addIssue({
          code: 'custom',
          path: ['options', index, 'name'],
          message: 'Option names must be unique.',
        })
      } else {
        usedNames.add(name.toLowerCase())
      }

      if (optionValues.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['options', index, 'valuesText'],
          message: 'Enter one or more values separated by commas.',
        })
      }

      const normalizedValues = optionValues.map((value) => value.toLowerCase())
      if (new Set(normalizedValues).size !== normalizedValues.length) {
        context.addIssue({
          code: 'custom',
          path: ['options', index, 'valuesText'],
          message: 'Option values must be unique.',
        })
      }
    })
  })

export type ProductDetailsFormValues = z.infer<typeof productDetailsSchema>
