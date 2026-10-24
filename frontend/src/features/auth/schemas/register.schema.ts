import { z } from 'zod'

/**
 * Counts Unicode code points so password limits match backend validation.
 */
const countUnicodeCodePoints = (value: string): number => Array.from(value).length

/**
 * Mirrors the backend registration rules and email normalization.
 */
export const registerSchema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(1, 'User name is required.')
      .max(50, 'User name must not exceed 50 characters.'),

    email: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .refine(
        (value) => countUnicodeCodePoints(value) >= 12,
        'Password must contain at least 12 characters.',
      )
      .refine(
        (value) => countUnicodeCodePoints(value) <= 128,
        'Password must not exceed 128 characters.',
      ),
  })
  .strict()

export type RegisterFormValues = z.input<typeof registerSchema>
export type RegisterRequest = z.output<typeof registerSchema>
