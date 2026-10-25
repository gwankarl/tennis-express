import type {
  PaginationMetadata,
  SellerApplication,
  SellerApplicationData,
  SellerApplicationStatus,
} from '../../seller-applications/types'

export interface AdminApplicantSummary {
  id: string
  email: string
  userName: string
  status: string
}

export interface AdminApplicationListRecord {
  application: {
    _id: string
    applicantId: string
    status: SellerApplicationStatus
    applicationData: {
      businessDetails: SellerApplicationData['businessDetails']
      contactDetails: Pick<SellerApplicationData['contactDetails'], 'region' | 'city'>
    }
    submittedAt: string
    reviewedAt: string | null
  }
  applicant: AdminApplicantSummary | null
}

export interface AdminApplicationDetails {
  application: SellerApplication & {
    applicantId: string
    reviewedBy: string | null
  }
  applicant: AdminApplicantSummary | null
}

export interface AdminApplicationListResponse {
  applications: AdminApplicationListRecord[]
  pagination: PaginationMetadata
}
