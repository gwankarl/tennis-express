import { apiClient } from '../../../lib/apiClient'
import type { LoginResponse } from './login'

/** Submits a Google ID token to the backend authentication endpoint. */
export async function googleLogin(idToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/google-login', { idToken })
  return response.data
}
