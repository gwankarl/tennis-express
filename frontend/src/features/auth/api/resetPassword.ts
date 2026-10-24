import { apiClient } from '../../../lib/apiClient'

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ResetPasswordResponse {
  success: true
  data: {
    message: string
  }
}

/** Submits the reset token and new password to the authentication API. */
export async function resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', request)

  return response.data
}
