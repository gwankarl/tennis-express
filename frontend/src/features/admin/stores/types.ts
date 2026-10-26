import type {
  SellerStoreFulfilmentProfile,
  SellerStoreLocation,
  SellerStoreOption,
  SellerStoreReturnPolicy,
  SellerStoreStatus,
} from '../../sellers/store/types'

export type AdminStoreStatus = SellerStoreStatus

export interface AdminStoreLogo {
  secureUrl: string
}

export interface AdminStoreRatingSummary {
  averageRating: number
  totalReviews: number
}

export interface AdminStoreListItem {
  id: string
  sellerId: string
  name: string
  slug: string
  description: string
  status: AdminStoreStatus
  location: Pick<SellerStoreLocation, 'region' | 'city'>
  logo: AdminStoreLogo | null
  ratingSummary: AdminStoreRatingSummary
  createdAt: string
  updatedAt: string
}

export interface AdminStoreDetails {
  id: string
  sellerId: string
  name: string
  slug: string
  description: string
  status: AdminStoreStatus
  location: SellerStoreLocation
  logo: AdminStoreLogo | null
  fulfilmentProfile: SellerStoreFulfilmentProfile | null
  deliveryOptions: SellerStoreOption[]
  collectionOptions: SellerStoreOption[]
  returnPolicy: SellerStoreReturnPolicy | null
  ratingSummary: AdminStoreRatingSummary
  createdAt: string
  updatedAt: string
}

export interface AdminStoresPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface AdminStoreListResult {
  stores: AdminStoreListItem[]
  pagination: AdminStoresPagination
}

export interface AdminStoreListQuery {
  page: number
  limit: number
  status?: AdminStoreStatus
}
