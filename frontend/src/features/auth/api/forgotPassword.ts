import { apiClient } from '../../../lib/apiClient'
import type { ForgotPasswordRequest } from '../schemas/forgotPassword.schema'

export interface ForgotPasswordResponse {
  success: true
  data: {
    message: string
  }
}

/** Requests password-reset instructions without exposing account existence. */
export async function requestPasswordReset(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', request)

  return response.data
}
