import { useQuery } from '@tanstack/react-query'
import { getWishlistSummary } from '../api/wishlist'

export const useWishlistSummary = (userId: string | undefined) =>
  useQuery({
    queryKey: ['user', 'wishlist', userId, 'summary'],
    queryFn: getWishlistSummary,
    enabled: Boolean(userId),
  })
