import { apiClient } from '../../../lib/apiClient'

export interface EmailVerificationResponse {
  success: true
  data: {
    message: string
  }
}

/**
 * Verifies an account using the single-use token from the email link.
 */
export async function verifyEmail(token: string): Promise<EmailVerificationResponse> {
  const response = await apiClient.post<EmailVerificationResponse>('/auth/verify-email', {
    token,
  })

  return response.data
}
