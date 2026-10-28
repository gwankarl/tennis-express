import { apiClient } from '../../../../lib/apiClient'
import type {
  AdminEligibleProductsQuery,
  AdminEligibleProductListResult,
  AdminPromotionListQuery,
  AdminPromotionListResult,
  AdminPromotionDetails,
  AdminPromotionMutationResult,
  CreateAdminMarketplaceCampaignRequest,
  UpdateAdminMarketplaceCampaignRequest,
} from '../types'

interface AdminPromotionListApiResponse {
  success: true
  data: AdminPromotionListResult
}

interface AdminEligibleProductListApiResponse {
  success: true
  data: AdminEligibleProductListResult
}

interface AdminPromotionMutationApiResponse {
  success: true
  data: {
    promotion: AdminPromotionMutationResult
  }
}

interface AdminPromotionDetailsApiResponse {
  success: true
  data: {
    promotion: AdminPromotionDetails
  }
}

/** Retrieves a paginated promotion list with optional type, status, name, and seller filters. */
export async function getAdminPromotions(
  query: AdminPromotionListQuery,
): Promise<AdminPromotionListResult> {
  const response = await apiClient.get<AdminPromotionListApiResponse>('/admin/promotions', {
    params: query,
  })

  return response.data.data
}

/** Retrieves products eligible for an administrator marketplace campaign. */
export async function getAdminEligibleProducts(
  query: AdminEligibleProductsQuery,
): Promise<AdminEligibleProductListResult> {
  const response = await apiClient.get<AdminEligibleProductListApiResponse>(
    '/admin/promotions/eligible-products',
    { params: query },
  )

  return response.data.data
}

/** Retrieves one promotion with its owner and eligible product summaries. */
export async function getAdminPromotion(promotionId: string): Promise<AdminPromotionDetails> {
  const response = await apiClient.get<AdminPromotionDetailsApiResponse>(
    `/admin/promotions/${encodeURIComponent(promotionId)}`,
  )

  return response.data.data.promotion
}

/** Cancels a cancellable marketplace campaign. */
export async function cancelAdminPromotion(promotionId: string): Promise<void> {
  await apiClient.post(`/admin/promotions/${encodeURIComponent(promotionId)}/cancel`)
}

/** Creates a marketplace campaign as an administrator. */
export async function createAdminMarketplaceCampaign(
  input: CreateAdminMarketplaceCampaignRequest,
): Promise<AdminPromotionMutationResult> {
  const response = await apiClient.post<AdminPromotionMutationApiResponse>(
    '/admin/promotions',
    input,
  )

  return response.data.data.promotion
}

/** Updates an editable marketplace campaign. */
export async function updateAdminMarketplaceCampaign(
  promotionId: string,
  changes: UpdateAdminMarketplaceCampaignRequest,
): Promise<AdminPromotionMutationResult> {
  const response = await apiClient.patch<AdminPromotionMutationApiResponse>(
    `/admin/promotions/${encodeURIComponent(promotionId)}`,
    changes,
  )

  return response.data.data.promotion
}
