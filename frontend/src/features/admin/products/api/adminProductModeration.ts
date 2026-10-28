import { apiClient } from '../../../../lib/apiClient'
import type {
  AdminProductListQuery,
  AdminProductListResult,
  AdminProductReviewDetails,
} from '../types'

interface AdminProductListApiResponse {
  success: true
  data: AdminProductListResult
}

interface AdminProductDetailsApiResponse {
  success: true
  data: AdminProductReviewDetails
}

interface AdminProductMutationApiResponse {
  success: true
  data: {
    product: {
      _id: string
      moderationStatus: AdminProductReviewDetails['product']['moderationStatus']
      publicationStatus: AdminProductReviewDetails['product']['publicationStatus']
      reviewedAt: string | null
      moderationReason: string | null
    }
  }
}

/** Retrieves one paginated product moderation queue. */
export async function getAdminProducts(
  query: AdminProductListQuery,
): Promise<AdminProductListResult> {
  const response = await apiClient.get<AdminProductListApiResponse>('/admin/products', {
    params: query,
  })

  return response.data.data
}

/** Retrieves product and related review details. */
export async function getAdminProduct(productId: string): Promise<AdminProductReviewDetails> {
  const response = await apiClient.get<AdminProductDetailsApiResponse>(
    `/admin/products/${encodeURIComponent(productId)}`,
  )

  return response.data.data
}

/** Approves a pending product. */
export async function approveAdminProduct(productId: string): Promise<void> {
  await apiClient.patch<AdminProductMutationApiResponse>(
    `/admin/products/${encodeURIComponent(productId)}/approve`,
  )
}

/** Rejects a pending product with the required reason. */
export async function rejectAdminProduct(productId: string, reason: string): Promise<void> {
  await apiClient.patch<AdminProductMutationApiResponse>(
    `/admin/products/${encodeURIComponent(productId)}/reject`,
    { reason },
  )
}

/** Requests changes to a pending product with the required reason. */
export async function requestAdminProductChanges(productId: string, reason: string): Promise<void> {
  await apiClient.patch<AdminProductMutationApiResponse>(
    `/admin/products/${encodeURIComponent(productId)}/request-changes`,
    { reason },
  )
}
