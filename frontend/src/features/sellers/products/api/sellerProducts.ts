import { apiClient } from '../../../../lib/apiClient'
import type {
  ListSellerProductsParams,
  PaginationMetadata,
  SellerProduct,
  SellerProductBrand,
  SellerProductBrandListResult,
  SellerProductCategory,
  SellerProductCategoryListResult,
  SellerProductDetails,
  SellerProductDraftRequest,
  SellerProductListResult,
  UpdateSellerProductRequest,
} from '../types'

interface SellerProductListApiResponse {
  success: true
  data: SellerProductListResult
}

interface SellerProductApiResponse<T extends SellerProduct = SellerProduct> {
  success: true
  data: {
    product: T
  }
}

interface CatalogPageApiResponse<T> {
  success: true
  data: {
    categories?: T[]
    brands?: T[]
    pagination: PaginationMetadata
  }
}

interface ProductVariantListApiResponse {
  success: true
  data: {
    variants: unknown[]
    pagination: PaginationMetadata
  }
}

/** Retrieves one page of products owned by the authenticated seller. */
export async function getSellerProducts(
  params: ListSellerProductsParams,
): Promise<SellerProductListResult> {
  const response = await apiClient.get<SellerProductListApiResponse>('/seller/products', {
    params,
  })

  return response.data.data
}

/** Archives a seller-owned product without deleting it. */
export async function archiveSellerProduct(productId: string): Promise<SellerProduct> {
  const response = await apiClient.post<SellerProductApiResponse>(
    `/seller/products/${encodeURIComponent(productId)}/archive`,
  )

  return response.data.data.product
}

/** Restores an archived product to draft publication status. */
export async function restoreSellerProduct(productId: string): Promise<SellerProduct> {
  const response = await apiClient.post<SellerProductApiResponse>(
    `/seller/products/${encodeURIComponent(productId)}/restore`,
  )

  return response.data.data.product
}

/** Retrieves one product owned by the authenticated seller. */
export async function getSellerProduct(productId: string): Promise<SellerProductDetails> {
  const response = await apiClient.get<SellerProductApiResponse<SellerProductDetails>>(
    `/seller/products/${encodeURIComponent(productId)}`,
  )

  return response.data.data.product
}

/** Creates an incomplete product draft for the authenticated seller. */
export async function createSellerProductDraft(
  input: SellerProductDraftRequest = {},
): Promise<SellerProductDetails> {
  const response = await apiClient.post<SellerProductApiResponse<SellerProductDetails>>(
    '/seller/products',
    input,
  )

  return response.data.data.product
}

/** Updates supported details on a seller-owned product. */
export async function updateSellerProduct(
  productId: string,
  changes: UpdateSellerProductRequest,
): Promise<SellerProductDetails> {
  const response = await apiClient.patch<SellerProductApiResponse<SellerProductDetails>>(
    `/seller/products/${encodeURIComponent(productId)}`,
    changes,
  )

  return response.data.data.product
}

/** Submits a completed product for admin moderation. */
export async function submitSellerProduct(productId: string): Promise<SellerProductDetails> {
  const response = await apiClient.post<SellerProductApiResponse<SellerProductDetails>>(
    `/seller/products/${encodeURIComponent(productId)}/submit`,
  )

  return response.data.data.product
}

async function getAllCatalogItems<T>(
  path: string,
  collectionKey: 'categories' | 'brands',
): Promise<T[]> {
  const items: T[] = []
  let page = 1

  while (true) {
    const response = await apiClient.get<CatalogPageApiResponse<T>>(path, {
      params: { page, limit: 100 },
    })

    const result = response.data.data
    items.push(...(result[collectionKey] ?? []))

    if (!result.pagination.hasNextPage) {
      return items
    }

    page = result.pagination.page + 1
  }
}

/** Retrieves every active category and its attribute definitions. */
export async function getSellerProductCategories(): Promise<SellerProductCategoryListResult> {
  const categories = await getAllCatalogItems<SellerProductCategory>(
    '/seller/products/catalog/categories',
    'categories',
  )

  return {
    categories,
    pagination: {
      page: 1,
      limit: categories.length || 1,
      totalItems: categories.length,
      totalPages: categories.length ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }
}

/** Retrieves every active brand for the product details form. */
export async function getSellerProductBrands(): Promise<SellerProductBrandListResult> {
  const brands = await getAllCatalogItems<SellerProductBrand>(
    '/seller/products/catalog/brands',
    'brands',
  )

  return {
    brands,
    pagination: {
      page: 1,
      limit: brands.length || 1,
      totalItems: brands.length,
      totalPages: brands.length ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }
}

/** Checks whether a product already has variants, which locks its options. */
export async function getSellerProductVariantCount(productId: string): Promise<number> {
  const response = await apiClient.get<ProductVariantListApiResponse>(
    `/seller/products/${encodeURIComponent(productId)}/variants`,
    { params: { page: 1, limit: 1 } },
  )

  return response.data.data.pagination.totalItems
}

/** Publishes an approved product owned by the authenticated seller. */
export async function publishSellerProduct(productId: string): Promise<SellerProduct> {
  const response = await apiClient.post<SellerProductApiResponse>(
    `/seller/products/${encodeURIComponent(productId)}/publish`,
  )

  return response.data.data.product
}

/** Permanently deletes an unsubmitted draft and its variants. */
export async function deleteSellerProduct(productId: string): Promise<{ productId: string }> {
  const response = await apiClient.delete<{
    success: true
    data: { productId: string }
  }>(`/seller/products/${encodeURIComponent(productId)}`)

  return response.data.data
}
