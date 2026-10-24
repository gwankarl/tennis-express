import { apiClient } from '../../../lib/apiClient'
import type { CurrentUser } from '../types'

/** Uploads a profile image using the multipart field expected by the backend. */
export async function updateProfileImage(file: File): Promise<CurrentUser> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await apiClient.post<{ success: true; data: { user: CurrentUser } }>(
    '/user/me/image',
    formData,
  )

  return response.data.data.user
}
