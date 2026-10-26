import { apiClient } from '../../../../lib/apiClient'
import type { SellerStore, SellerStoreStatus, UpdateSellerStoreRequest } from '../types'

interface SellerStoreApiResponse {
  success: true
  data: {
    store: SellerStore
  }
}

/** Retrieves the authenticated seller's storefront. */
export async function getSellerStore(): Promise<SellerStore> {
  const response = await apiClient.get<SellerStoreApiResponse>('/seller/store')

  return response.data.data.store
}

/** Updates supported storefront details. */
export async function updateSellerStore(changes: UpdateSellerStoreRequest): Promise<SellerStore> {
  const response = await apiClient.patch<SellerStoreApiResponse>('/seller/store', changes)

  return response.data.data.store
}

/** Uploads or replaces the authenticated seller's storefront logo. */
export async function uploadSellerStoreLogo(file: File): Promise<SellerStore> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await apiClient.patch<SellerStoreApiResponse>('/seller/store/logo', formData)

  return response.data.data.store
}

/** Activates or pauses the authenticated seller's storefront. */
export async function updateSellerStoreStatus(status: SellerStoreStatus): Promise<SellerStore> {
  const response = await apiClient.patch<SellerStoreApiResponse>('/seller/store/status', { status })

  return response.data.data.store
}
