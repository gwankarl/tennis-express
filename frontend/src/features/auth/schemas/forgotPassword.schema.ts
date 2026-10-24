import { z } from 'zod'

/** Validates the email address required to request password recovery. */
export const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .max(254, 'Email address must not exceed 254 characters.'),
  })
  .strict()

export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>
export type ForgotPasswordRequest = z.output<typeof forgotPasswordSchema>
