import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelAdminPromotion,
  getAdminEligibleProducts,
  getAdminPromotion,
  getAdminPromotions,
  createAdminMarketplaceCampaign,
  updateAdminMarketplaceCampaign,
} from '../api/adminPromotions'
import type {
  AdminEligibleProductsQuery,
  AdminPromotionListQuery,
  CreateAdminMarketplaceCampaignRequest,
  UpdateAdminMarketplaceCampaignRequest,
} from '../types'

export const adminPromotionsQueryKey = ['admin', 'promotions'] as const

export const adminEligibleProductsQueryKey = [
  ...adminPromotionsQueryKey,
  'eligible-products',
] as const

/** Fetches the paginated admin promotion list for the current filters. */
export function useAdminPromotions(query: AdminPromotionListQuery) {
  return useQuery({
    queryKey: [...adminPromotionsQueryKey, 'list', query],
    queryFn: () => getAdminPromotions(query),
    refetchInterval: 30_000,
  })
}

/** Fetches eligible products for the marketplace campaign selector. */
export function useAdminEligibleProducts(query: AdminEligibleProductsQuery) {
  return useQuery({
    queryKey: [...adminEligibleProductsQueryKey, query],
    queryFn: () => getAdminEligibleProducts(query),
  })
}

export const adminPromotionDetailQueryKey = (promotionId: string) =>
  [...adminPromotionsQueryKey, 'detail', promotionId] as const

/** Fetches one promotion and its eligible product summaries. */
export function useAdminPromotion(promotionId: string | null) {
  return useQuery({
    queryKey: adminPromotionDetailQueryKey(promotionId ?? ''),
    queryFn: () => getAdminPromotion(promotionId as string),
    enabled: Boolean(promotionId),
    refetchInterval: 30_000,
  })
}

/** Cancels a promotion and refreshes its detail and list data. */
export function useCancelAdminPromotion(promotionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cancelAdminPromotion(promotionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminPromotionDetailQueryKey(promotionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminPromotionsQueryKey,
        }),
      ])
    },
  })
}

/** Creates a campaign and refreshes promotion lists. */
export function useCreateAdminMarketplaceCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAdminMarketplaceCampaignRequest) =>
      createAdminMarketplaceCampaign(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminPromotionsQueryKey,
      })
    },
  })
}

/** Updates a campaign and refreshes its detail and promotion lists. */
export function useUpdateAdminMarketplaceCampaign(promotionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (changes: UpdateAdminMarketplaceCampaignRequest) =>
      updateAdminMarketplaceCampaign(promotionId, changes),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminPromotionDetailQueryKey(promotionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminPromotionsQueryKey,
        }),
      ])
    },
  })
}
