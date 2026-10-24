import { z } from 'zod'

/** Counts Unicode code points to match the backend password limits. */
const countUnicodeCodePoints = (value: string): number => Array.from(value).length

/** Validates the new password and its frontend-only confirmation field. */
export const resetPasswordSchema = z
  .object({
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
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .strict()
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      })
    }
  })

export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>
export type ResetPasswordFormRequest = z.output<typeof resetPasswordSchema>
