import { apiClient } from '../../../lib/apiClient'

export interface LogoutResponse {
  success: true
  message: string
}

/** Requests server-side session revocation and refresh-cookie clearing. */
export async function logout(): Promise<LogoutResponse> {
  const response = await apiClient.post<LogoutResponse>('/auth/logout')
  return response.data
}
