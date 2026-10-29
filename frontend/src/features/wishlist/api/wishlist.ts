import { apiClient } from '../../../lib/apiClient'
import type { WishlistResponse } from '../types'

export const getWishlistSummary = async (): Promise<WishlistResponse> => {
  const response = await apiClient.get<{ data: WishlistResponse }>('/wishlist', {
    params: { page: 1, limit: 1 },
  })

  return response.data.data
}
