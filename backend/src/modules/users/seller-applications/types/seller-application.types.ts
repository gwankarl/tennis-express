import type { Types } from 'mongoose';

/** Valid statuses for a seller application. */
export const SELLER_APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;

/** A valid seller application status. */
export type SellerApplicationStatus = (typeof SELLER_APPLICATION_STATUSES)[number];

/** Types of sellers permitted to apply. */
export const SELLER_TYPES = ['individual', 'business'] as const;

export type SellerType = (typeof SELLER_TYPES)[number];

/** Product sourcing methods declared by an applicant. */
export const PRODUCT_SOURCING_METHODS = [
  'manufacturer',
  'authorized_distributor',
  'wholesaler',
  'local_supplier',
  'other',
] as const;

export type ProductSourcingMethod = (typeof PRODUCT_SOURCING_METHODS)[number];

/** Fulfilment methods a seller is willing to provide. */
export const SELLER_FULFILMENT_METHODS = ['delivery', 'collection'] as const;

export type SellerFulfilmentMethod = (typeof SELLER_FULFILMENT_METHODS)[number];

/** Cameroon regions accepted for seller operations. */
export const CAMEROON_REGIONS = [
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
] as const;

export type CameroonRegion = (typeof CAMEROON_REGIONS)[number];

/** Dispatch-time options accepted for seller applications. */
export const SELLER_DISPATCH_TIMES = [
  'same_day',
  'one_to_three_days',
  'four_to_seven_days',
  'over_seven_days',
] as const;

export type SellerDispatchTime = (typeof SELLER_DISPATCH_TIMES)[number];

/** Types of supporting documents an applicant may submit. */
export const SELLER_APPLICATION_DOCUMENT_TYPES = [
  'business_registration',
  'brand_authorization',
  'other',
] as const;

export type SellerApplicationDocumentType = (typeof SELLER_APPLICATION_DOCUMENT_TYPES)[number];

/**
 * Reference to a supporting document uploaded through the configured
 * document-storage integration.
 */
export interface SellerApplicationDocument {
  documentType: SellerApplicationDocumentType;
  publicId: string;
  secureUrl: string;
  fileName: string;
}

/** Business or trading details submitted by the applicant. */
export interface SellerApplicationBusinessDetails {
  sellerType: SellerType;
  businessName: string | null;
  storeName: string | null;
  businessRegistrationNumber: string | null;
}

/** Operating location and contact details submitted by the applicant. */
export interface SellerApplicationContactDetails {
  region: CameroonRegion;
  city: string;
  address: string;
  phoneNumber: string;
}

/** Information about the products the applicant intends to sell. */
export interface SellerApplicationProductDetails {
  businessDescription: string;
  sourcingMethods: ProductSourcingMethod[];
  otherSourcingMethod: string | null;
}

/** Fulfilment capabilities declared by the applicant. */
export interface SellerApplicationFulfilmentDetails {
  methods: SellerFulfilmentMethod[];
  serviceRegions: CameroonRegion[];
  dispatchTime: SellerDispatchTime;
}

/** Applicant declarations that must be accepted before submission. */
export interface SellerApplicationDeclarations {
  informationIsAccurate: true;
  sellerPolicyAccepted: true;
  productsAreGenuineAndLegallySellable: true;
}

/** Structured application details submitted for administrator review. */
export interface SellerApplicationData {
  businessDetails: SellerApplicationBusinessDetails;
  contactDetails: SellerApplicationContactDetails;
  productDetails: SellerApplicationProductDetails;
  fulfilmentDetails: SellerApplicationFulfilmentDetails;
  supportingDocuments: SellerApplicationDocument[];
  declarations: SellerApplicationDeclarations;
}

/** Application details submitted by the client, before document uploads. */
export type SellerApplicationSubmissionData = Omit<SellerApplicationData, 'supportingDocuments'>;

/** A supporting document received by the backend before Cloudinary upload. */
export interface SellerApplicationDocumentUpload {
  documentType: SellerApplicationDocumentType;
  buffer: Buffer;
  fileName: string;
}

/** TypeScript representation of a persisted seller application. */
export interface SellerApplication {
  _id: Types.ObjectId;
  applicantId: Types.ObjectId;
  status: SellerApplicationStatus;
  applicationData: SellerApplicationData;
  submittedAt: Date;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  decisionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
