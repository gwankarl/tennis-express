import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelSellerPromotion,
  createSellerPromotion,
  getSellerPromotion,
  getSellerPromotions,
  updateSellerPromotion,
} from '../api/sellerPromotions'
import type {
  CreateSellerPromotionRequest,
  ListSellerPromotionsParams,
  UpdateSellerPromotionRequest,
} from '../types'

export const sellerPromotionsQueryKey = ['seller', 'promotions'] as const

export const sellerPromotionDetailQueryKey = (promotionId: string) =>
  [...sellerPromotionsQueryKey, 'detail', promotionId] as const

/** Fetches the seller's promotions for the requested page and status. */
export function useSellerPromotions(params: ListSellerPromotionsParams) {
  return useQuery({
    queryKey: [...sellerPromotionsQueryKey, 'list', params],
    queryFn: () => getSellerPromotions(params),
    refetchInterval: 30_000,
  })
}

/** Fetches one promotion owned by the authenticated seller. */
export function useSellerPromotion(promotionId: string) {
  return useQuery({
    queryKey: sellerPromotionDetailQueryKey(promotionId),
    queryFn: () => getSellerPromotion(promotionId),
    enabled: Boolean(promotionId),
    refetchInterval: 30_000,
  })
}

/** Creates a promotion and refreshes cached promotion lists. */
export function useCreateSellerPromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSellerPromotionRequest) => createSellerPromotion(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...sellerPromotionsQueryKey, 'list'],
      })
    },
  })
}

/** Updates a promotion, refreshes its detail cache, and refreshes promotion lists. */
export function useUpdateSellerPromotion(promotionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (changes: UpdateSellerPromotionRequest) =>
      updateSellerPromotion(promotionId, changes),
    onSuccess: async (promotion) => {
      queryClient.setQueryData(sellerPromotionDetailQueryKey(promotionId), promotion)

      await queryClient.invalidateQueries({
        queryKey: [...sellerPromotionsQueryKey, 'list'],
      })
    },
  })
}

/** Cancels a promotion and refreshes its detail and list caches. */
export function useCancelSellerPromotion(promotionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cancelSellerPromotion(promotionId),
    onSuccess: async (promotion) => {
      queryClient.setQueryData(sellerPromotionDetailQueryKey(promotionId), promotion)

      await queryClient.invalidateQueries({
        queryKey: [...sellerPromotionsQueryKey, 'list'],
      })
    },
  })
}
