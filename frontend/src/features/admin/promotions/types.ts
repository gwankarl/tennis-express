import type {
  ProductModerationStatus,
  ProductPublicationStatus,
  PaginationMetadata,
} from '../../sellers/products/types'

export const adminPromotionStatuses = [
  'draft',
  'scheduled',
  'active',
  'ended',
  'cancelled',
] as const

export type AdminPromotionStatus = (typeof adminPromotionStatuses)[number]

export type AdminPromotionType = 'seller_discount' | 'marketplace_campaign'
export type AdminPromotionDiscountType = 'percentage' | 'fixed_amount'

/** Filters accepted by GET /admin/promotions. */
export interface AdminPromotionListQuery {
  page: number
  limit: number
  type?: AdminPromotionType
  status?: AdminPromotionStatus
  search?: string
  sellerId?: string
}

/** A promotion list row, including the optional seller and store summaries. */
export interface AdminPromotionListItem {
  _id: string
  name: string
  type: AdminPromotionType
  sellerId: string | null
  eligibleProductIds: string[]
  discountType: AdminPromotionDiscountType
  discountValue: number
  startsAt: string
  endsAt: string
  status: AdminPromotionStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  seller: {
    id: string
    userName: string
  } | null
  store: {
    id: string
    name: string
    slug: string
  } | null
}

/** Fields accepted when creating a marketplace campaign. */
export interface CreateAdminMarketplaceCampaignRequest {
  name: string
  eligibleProductIds: string[]
  discountType: AdminPromotionDiscountType
  discountValue: number
  startsAt: string
  endsAt: string
}

/** Fields accepted when updating a draft or scheduled campaign. */
export type UpdateAdminMarketplaceCampaignRequest = Partial<CreateAdminMarketplaceCampaignRequest>

/** Raw promotion returned by create and update endpoints. */
export type AdminPromotionMutationResult = Omit<AdminPromotionListItem, 'seller' | 'store'>

export interface AdminPromotionListResult {
  promotions: AdminPromotionListItem[]
  pagination: PaginationMetadata
}

export interface AdminPromotionProductDetails {
  id: string
  name: string | null
  slug: string | null
  moderationStatus: ProductModerationStatus | null
  publicationStatus: ProductPublicationStatus | null
  primaryImage: {
    secureUrl: string
    altText: string
  } | null
  seller: {
    id: string
    userName: string
  } | null
  store: {
    id: string
    name: string
    slug: string
  } | null
}

export interface AdminPromotionDetails extends AdminPromotionListItem {
  eligibleProducts: AdminPromotionProductDetails[]
}

/** Filters accepted by GET /admin/promotions/eligible-products. */
export interface AdminEligibleProductsQuery {
  page: number
  limit: number
  search?: string
  sellerId?: string
  storeId?: string
  categoryId?: string
}

export interface AdminEligibleProductListItem {
  id: string
  name: string | null
  moderationStatus: 'approved'
  publicationStatus: 'published'
  primaryImage: {
    secureUrl: string
    altText: string
  } | null
  category: {
    id: string
    name: string
  } | null
  seller: {
    id: string
    userName: string
  }
  store: {
    id: string
    name: string
    slug: string
  }
  activeVariants: {
    count: number
    minimumPrice: number
    maximumPrice: number
  }
}

export interface AdminEligibleProductListResult {
  products: AdminEligibleProductListItem[]
  pagination: PaginationMetadata
}
