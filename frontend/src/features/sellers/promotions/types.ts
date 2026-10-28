export const sellerPromotionStatuses = [
  'draft',
  'scheduled',
  'active',
  'ended',
  'cancelled',
] as const

export type SellerPromotionStatus = (typeof sellerPromotionStatuses)[number]

export type SellerPromotionDiscountType = 'percentage' | 'fixed_amount'

/** Promotion data returned by the seller promotion API. */
export interface SellerPromotion {
  _id: string
  name: string
  type: 'seller_discount'
  sellerId: string | null
  eligibleProductIds: string[]
  discountType: SellerPromotionDiscountType
  discountValue: number
  startsAt: string
  endsAt: string
  status: SellerPromotionStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SellerPromotionPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ListSellerPromotionsParams {
  page: number
  limit: number
  status?: SellerPromotionStatus
}

export interface SellerPromotionListResult {
  promotions: SellerPromotion[]
  pagination: SellerPromotionPagination
}

export interface CreateSellerPromotionRequest {
  name: string
  eligibleProductIds: string[]
  discountType: SellerPromotionDiscountType
  discountValue: number
  startsAt: string
  endsAt: string
}

export type UpdateSellerPromotionRequest = Partial<CreateSellerPromotionRequest>
