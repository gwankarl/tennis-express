import { apiClient } from '../../../lib/apiClient'
import type { PaginationMetadata, SellerApplication } from '../types'

interface SellerApplicationResponse {
  success: true
  data: {
    application: SellerApplication
  }
}

interface SellerApplicationHistoryResponse {
  success: true
  data: {
    applications: SellerApplication[]
    pagination: PaginationMetadata
  }
}

export interface SupportingDocumentFile {
  file: File
  documentType: string
}

export interface SellerApplicationUpload {
  applicationData: unknown
  documents: SupportingDocumentFile[]
  onProgress?: (percentage: number) => void
}

/** Sends the backend's multipart application format. */
export async function saveSellerApplication(
  upload: SellerApplicationUpload,
  rejectedApplicationId?: string,
): Promise<SellerApplication> {
  const formData = new FormData()
  const documentTypes = upload.documents.map((document) => document.documentType)

  formData.append('applicationData', JSON.stringify(upload.applicationData))
  formData.append('documentTypes', JSON.stringify(documentTypes))

  upload.documents.forEach(({ file }) => {
    formData.append('documents', file)
  })

  const path = rejectedApplicationId
    ? `/seller-applications/${encodeURIComponent(rejectedApplicationId)}/resubmit`
    : '/seller-applications/'

  const response = await apiClient.post<SellerApplicationResponse>(path, formData, {
    onUploadProgress: (event) => {
      if (event.total) {
        upload.onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    },
  })

  return response.data.data.application
}

/** Fetches one page of the authenticated user's application history. */
export async function getSellerApplicationHistory(
  page: number,
  limit: number,
): Promise<SellerApplicationHistoryResponse['data']> {
  const response = await apiClient.get<SellerApplicationHistoryResponse>(
    '/seller-applications/me/history',
    { params: { page, limit } },
  )

  return response.data.data
}

export const sellerApplicationHistoryQueryKey = (page: number, limit: number) =>
  ['seller-applications', 'history', page, limit] as const
