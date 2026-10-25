export const sellerApplicationStatuses = ['pending', 'approved', 'rejected'] as const
export type SellerApplicationStatus = (typeof sellerApplicationStatuses)[number]

export const sellerApplicationDocumentTypes = [
  'business_registration',
  'brand_authorization',
  'other',
] as const
export type SellerApplicationDocumentType = (typeof sellerApplicationDocumentTypes)[number]

export interface SellerApplicationDocument {
  documentType: SellerApplicationDocumentType
  publicId: string
  secureUrl: string
  fileName: string
}

export interface SellerApplicationData {
  businessDetails: {
    sellerType: 'individual' | 'business'
    businessName: string | null
    storeName: string | null
    businessRegistrationNumber: string | null
  }
  contactDetails: {
    region: string
    city: string
    address: string
    phoneNumber: string
  }
  productDetails: {
    businessDescription: string
    sourcingMethods: string[]
    otherSourcingMethod: string | null
  }
  fulfilmentDetails: {
    methods: string[]
    serviceRegions: string[]
    dispatchTime: string
  }
  supportingDocuments: SellerApplicationDocument[]
  declarations: {
    informationIsAccurate: true
    sellerPolicyAccepted: true
    productsAreGenuineAndLegallySellable: true
  }
}

export interface SellerApplication {
  _id: string
  status: SellerApplicationStatus
  applicationData: SellerApplicationData
  submittedAt: string
  reviewedAt: string | null
  decisionReason: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginationMetadata {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface SellerApplicationHistory {
  applications: SellerApplication[]
  pagination: PaginationMetadata
}
