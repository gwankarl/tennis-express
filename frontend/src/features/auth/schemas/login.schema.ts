import { z } from 'zod'

/** Validates login credentials using the backend's accepted limits. */
export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .max(254, 'Email address must not exceed 254 characters.'),
    password: z
      .string()
      .min(1, 'Password is required.')
      .max(128, 'Password must not exceed 128 characters.'),
  })
  .strict()

export type LoginFormValues = z.input<typeof loginSchema>
export type LoginRequest = z.output<typeof loginSchema>
