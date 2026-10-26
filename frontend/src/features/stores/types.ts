import type {
  SellerDispatchTime,
  SellerFulfilmentMethod,
  SellerStoreOption,
  SellerStoreRegion,
  SellerStoreReturnPolicy,
} from '../sellers/store/types'

export interface PublicStore {
  id: string
  name: string
  slug: string
  description: string
  location: {
    region: string
    city: string
  }
  logo: {
    secureUrl: string
  } | null
  fulfilmentProfile: {
    methods: SellerFulfilmentMethod[]
    serviceRegions: SellerStoreRegion[]
    dispatchTime: SellerDispatchTime
  } | null
  deliveryOptions: SellerStoreOption[]
  collectionOptions: SellerStoreOption[]
  returnPolicy: SellerStoreReturnPolicy | null
  ratingSummary: {
    averageRating: number
    totalReviews: number
  }
}
