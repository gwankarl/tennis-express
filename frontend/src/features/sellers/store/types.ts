export const sellerStoreStatuses = ['active', 'paused'] as const
export type SellerStoreStatus = (typeof sellerStoreStatuses)[number]

export const sellerFulfilmentMethods = ['delivery', 'collection'] as const
export type SellerFulfilmentMethod = (typeof sellerFulfilmentMethods)[number]

export const sellerStoreRegions = [
  'Adamawa',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'Northwest',
  'South',
  'Southwest',
  'West',
] as const
export type SellerStoreRegion = (typeof sellerStoreRegions)[number]

export const sellerDispatchTimes = [
  'same_day',
  'one_to_three_days',
  'four_to_seven_days',
  'over_seven_days',
] as const
export type SellerDispatchTime = (typeof sellerDispatchTimes)[number]

export interface SellerStoreLocation {
  region: SellerStoreRegion
  city: string
  address: string
}

export interface SellerStoreLogo {
  publicId: string
  secureUrl: string
}

export interface SellerStoreFulfilmentProfile {
  methods: SellerFulfilmentMethod[]
  serviceRegions: SellerStoreRegion[]
  dispatchTime: SellerDispatchTime
}

export interface SellerStoreOption {
  name: string
  description: string
  fee: number
}

export interface SellerStoreReturnPolicy {
  summary: string
  returnWindowDays: number
  conditions: string[]
}

export interface SellerStoreRatingSummary {
  averageRating: number
  totalReviews: number
}

/** Store data returned by the authenticated seller store endpoints. */
export interface SellerStore {
  _id: string
  sellerId: string
  name: string
  slug: string
  description: string
  location: SellerStoreLocation
  logo: SellerStoreLogo | null
  status: SellerStoreStatus
  fulfilmentProfile: SellerStoreFulfilmentProfile | null
  deliveryOptions: SellerStoreOption[]
  collectionOptions: SellerStoreOption[]
  returnPolicy: SellerStoreReturnPolicy | null
  ratingSummary: SellerStoreRatingSummary
  createdAt: string
  updatedAt: string
}

/** Editable fields accepted by PATCH /seller/store. */
export interface UpdateSellerStoreRequest {
  name?: string
  description?: string
  fulfilmentProfile?: SellerStoreFulfilmentProfile | null
  location?: SellerStoreLocation
  deliveryOptions?: SellerStoreOption[]
  collectionOptions?: SellerStoreOption[]
  returnPolicy?: SellerStoreReturnPolicy | null
}
