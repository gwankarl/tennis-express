import { useQuery } from '@tanstack/react-query'
import { getCartSummary } from '../api/cart'

export const useCartSummary = (userId: string | undefined) =>
  useQuery({
    queryKey: ['user', 'cart', userId, 'summary'],
    queryFn: getCartSummary,
    enabled: Boolean(userId),
    select: (response) => response.cart,
  })
