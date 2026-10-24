import { apiClient } from '../../../lib/apiClient'
import type { CurrentUser } from '../types'

/** Fetches the authenticated user's account and profile data. */
export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<{ success: true; data: { user: CurrentUser } }>('/user/me')
  return response.data.data.user
}

export const currentUserQueryKey = ['user', 'me'] as const
