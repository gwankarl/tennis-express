import { apiClient } from '../../../../../lib/apiClient'
import type {
  CreateSellerProductVariantRequest,
  ListSellerProductVariantsParams,
  SellerProductVariant,
  SellerProductVariantListResult,
  UpdateSellerProductVariantRequest,
  UpdateSellerProductVariantStatusRequest,
} from '../../types'

interface VariantApiResponse {
  success: true
  data: {
    variant: SellerProductVariant
  }
}

interface VariantListApiResponse {
  success: true
  data: SellerProductVariantListResult
}

function productVariantsPath(productId: string): string {
  return `/seller/products/${encodeURIComponent(productId)}/variants`
}

/** Retrieves one page of variants for a seller-owned product. */
export async function getSellerProductVariants(
  productId: string,
  params: ListSellerProductVariantsParams,
): Promise<SellerProductVariantListResult> {
  const response = await apiClient.get<VariantListApiResponse>(productVariantsPath(productId), {
    params,
  })

  return response.data.data
}

/** Counts all variants and active variants across every page. */
export async function getSellerProductVariantSummary(
  productId: string,
): Promise<{ totalCount: number; activeCount: number }> {
  let page = 1
  let totalCount = 0
  let activeCount = 0
  let hasNextPage = true

  while (hasNextPage) {
    const result = await getSellerProductVariants(productId, { page, limit: 100 })

    totalCount = result.pagination.totalItems
    activeCount += result.variants.filter((variant) => variant.status === 'active').length
    hasNextPage = result.pagination.hasNextPage
    page += 1
  }

  return { totalCount, activeCount }
}

/** Retrieves one variant belonging to a seller-owned product. */
export async function getSellerProductVariant(
  productId: string,
  variantId: string,
): Promise<SellerProductVariant> {
  const response = await apiClient.get<VariantApiResponse>(
    `${productVariantsPath(productId)}/${encodeURIComponent(variantId)}`,
  )

  return response.data.data.variant
}

/** Creates a variant for a seller-owned product. */
export async function createSellerProductVariant(
  productId: string,
  input: CreateSellerProductVariantRequest,
): Promise<SellerProductVariant> {
  const response = await apiClient.post<VariantApiResponse>(productVariantsPath(productId), input)

  return response.data.data.variant
}

/** Updates editable fields on one seller-owned product variant. */
export async function updateSellerProductVariant(
  productId: string,
  variantId: string,
  changes: UpdateSellerProductVariantRequest,
): Promise<SellerProductVariant> {
  const response = await apiClient.patch<VariantApiResponse>(
    `${productVariantsPath(productId)}/${encodeURIComponent(variantId)}`,
    changes,
  )

  return response.data.data.variant
}

/** Activates or deactivates one seller-owned product variant. */
export async function updateSellerProductVariantStatus(
  productId: string,
  variantId: string,
  input: UpdateSellerProductVariantStatusRequest,
): Promise<SellerProductVariant> {
  const response = await apiClient.patch<VariantApiResponse>(
    `${productVariantsPath(productId)}/${encodeURIComponent(variantId)}/status`,
    input,
  )

  return response.data.data.variant
}
