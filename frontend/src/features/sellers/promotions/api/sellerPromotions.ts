import { apiClient } from '../../../../lib/apiClient'
import type {
  ListSellerPromotionsParams,
  SellerPromotion,
  SellerPromotionListResult,
  CreateSellerPromotionRequest,
  UpdateSellerPromotionRequest,
} from '../types'

interface SellerPromotionListApiResponse {
  success: true
  data: SellerPromotionListResult
}

interface SellerPromotionApiResponse {
  success: true
  data: {
    promotion: SellerPromotion
  }
}

/** Retrieves one page of promotions owned by the authenticated seller. */
export async function getSellerPromotions(
  params: ListSellerPromotionsParams,
): Promise<SellerPromotionListResult> {
  const response = await apiClient.get<SellerPromotionListApiResponse>('/seller/promotions', {
    params,
  })

  return response.data.data
}

/** Retrieves one promotion owned by the authenticated seller. */
export async function getSellerPromotion(promotionId: string): Promise<SellerPromotion> {
  const response = await apiClient.get<SellerPromotionApiResponse>(
    `/seller/promotions/${encodeURIComponent(promotionId)}`,
  )

  return response.data.data.promotion
}

/** Creates a seller promotion using the backend's validated request contract. */
export async function createSellerPromotion(
  input: CreateSellerPromotionRequest,
): Promise<SellerPromotion> {
  const response = await apiClient.post<SellerPromotionApiResponse>('/seller/promotions', input)

  return response.data.data.promotion
}

/** Updates an editable promotion owned by the authenticated seller. */
export async function updateSellerPromotion(
  promotionId: string,
  changes: UpdateSellerPromotionRequest,
): Promise<SellerPromotion> {
  const response = await apiClient.patch<SellerPromotionApiResponse>(
    `/seller/promotions/${encodeURIComponent(promotionId)}`,
    changes,
  )

  return response.data.data.promotion
}

/** Cancels a cancellable promotion owned by the authenticated seller. */
export async function cancelSellerPromotion(promotionId: string): Promise<SellerPromotion> {
  const response = await apiClient.post<SellerPromotionApiResponse>(
    `/seller/promotions/${encodeURIComponent(promotionId)}/cancel`,
  )

  return response.data.data.promotion
}
