import { apiClient } from '../../../lib/apiClient'
import type { CartResponse } from '../types'

export const getCartSummary = async (): Promise<CartResponse> => {
  const response = await apiClient.get<{ data: CartResponse }>('/cart')
  return response.data.data
}
