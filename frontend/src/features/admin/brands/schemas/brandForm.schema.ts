import { z } from 'zod'

/** Mirrors the brand name and description constraints accepted by the backend. */
export const brandFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a brand name.')
    .max(120, 'Brand names must not exceed 120 characters.'),
  description: z.string().trim().max(2000, 'Descriptions must not exceed 2,000 characters.'),
})

export type BrandFormValues = z.infer<typeof brandFormSchema>
