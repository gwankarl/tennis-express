import { apiClient } from '../../../lib/apiClient'
import type { AuthUser } from '../types'

export interface RefreshSessionResponse {
  success: true
  data: {
    accessToken: string
    tokenType: 'Bearer'
    expiresIn: number
    user: AuthUser
  }
}

let refreshRequest: Promise<RefreshSessionResponse> | null = null

/**
 * Refreshes the session using the HttpOnly cookie.
 * Concurrent callers share one request during app initialization.
 */
export function refreshSession(): Promise<RefreshSessionResponse> {
  if (!refreshRequest) {
    refreshRequest = apiClient
      .post<RefreshSessionResponse>('/auth/refresh-token')
      .then((response) => response.data)
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}
