import { z } from 'zod'

/** Mirrors the editable profile detail constraints enforced by the backend. */
export const profileUpdateSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, 'User name must not be empty.')
    .max(50, 'User name must not exceed 50 characters.'),
  phoneNumber: z.string().trim().max(25, 'Phone number must not exceed 25 characters.'),
  preferredContactMethod: z.enum(['', 'email', 'phone']),
})

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>
