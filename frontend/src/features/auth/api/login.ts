import { apiClient } from '../../../lib/apiClient'
import type { LoginRequest } from '../schemas/login.schema'

export interface LoginResponse {
  success: true
  data: {
    user: {
      id: string
      email: string
      userName: string
      roles: string[]
      status: string
    }
    tokens: {
      accessToken: string
      tokenType: 'Bearer'
      expiresIn: number
    }
  }
}

/** Submits login credentials to the versioned authentication API. */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', request)
  return response.data
}
