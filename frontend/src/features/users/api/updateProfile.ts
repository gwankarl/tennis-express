import { apiClient } from '../../../lib/apiClient'
import type { PreferredContactMethod, CurrentUser } from '../types'

/** Fields accepted by PATCH /user/me. */
export interface UpdateProfileRequest {
  userName?: string
  contactDetails?: {
    phoneNumber?: string
    preferredContactMethod?: PreferredContactMethod
  }
}

/** Saves supported profile detail fields and returns the updated account. */
export async function updateProfile(request: UpdateProfileRequest): Promise<CurrentUser> {
  const response = await apiClient.patch<{ success: true; data: { user: CurrentUser } }>(
    '/user/me',
    request,
  )

  return response.data.data.user
}
