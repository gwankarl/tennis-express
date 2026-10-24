import { apiClient } from '../../../lib/apiClient'
import type { RegisterRequest } from '../schemas/register.schema'

export interface RegisterResponse {
  success: true
  data: {
    message: string
  }
}

/**
 * Submits registration details to the versioned authentication API.
 */
export async function registerAccount(request: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', request)

  return response.data
}
