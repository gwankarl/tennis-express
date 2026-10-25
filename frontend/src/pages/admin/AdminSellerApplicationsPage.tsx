import { useState } from 'react'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Pagination } from '../../components/ui/Pagination'
import { AdminApplicationDetailDialog } from '../../features/admin/seller-applications/components/AdminApplicationDetailDialog'
import { AdminApplicationList } from '../../features/admin/seller-applications/components/AdminApplicationList'
import {
  useAdminApplication,
  useAdminApplications,
  useApproveAdminApplication,
  useRejectAdminApplication,
} from '../../features/admin/seller-applications/hooks/useAdminSellerApplications'
import type { SellerApplicationStatus } from '../../features/seller-applications/types'
import { getApiError } from '../../lib/apiError'

const pageSize = 20

const statusOptions: { value: SellerApplicationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

/** Lets administrators browse and review seller applications. */
export default function AdminSellerApplicationsPage() {
  const [status, setStatus] = useState<SellerApplicationStatus>('pending')
  const [page, setPage] = useState(1)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    title: string
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  const applicationsQuery = useAdminApplications({ status, page, limit: pageSize })
  const detailQuery = useAdminApplication(selectedApplicationId)
  const approveMutation = useApproveAdminApplication()
  const rejectMutation = useRejectAdminApplication()
  const isMutating = approveMutation.isPending || rejectMutation.isPending

  const handleDecisionSuccess = (message: string) => {
    setSelectedApplicationId(null)
    setNotice({ title: 'Review saved', message, tone: 'success' })
  }

  const handleDecisionError = (error: unknown) => {
    const apiError = getApiError(error)
    setNotice({ title: 'Review could not be saved', message: apiError.message, tone: 'error' })
  }

  const handleApprove = () => {
    if (!selectedApplicationId) return

    approveMutation.mutate(selectedApplicationId, {
      onSuccess: () => handleDecisionSuccess('The application was approved.'),
      onError: handleDecisionError,
    })
  }

  const handleReject = (reason: string) => {
    if (!selectedApplicationId) return

    rejectMutation.mutate(
      { applicationId: selectedApplicationId, reason },
      {
        onSuccess: () => handleDecisionSuccess('The application was rejected.'),
        onError: handleDecisionError,
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Seller Applications"
        description="Review applications and record seller decisions."
      />

      {notice && (
        <Notification
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
          onDismiss={() => setNotice(null)}
        />
      )}

      <nav aria-label="Filter applications by status" className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={status === option.value}
            onClick={() => {
              setStatus(option.value)
              setPage(1)
              setNotice(null)
            }}
            className={[
              'min-h-11 rounded-md border px-4 py-2 text-supporting font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              status === option.value
                ? 'border-primary bg-secondary text-primary'
                : 'border-border bg-surface text-text-secondary hover:bg-page',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {applicationsQuery.isPending ? (
        <LoadingState label={`Loading ${status} applications…`} />
      ) : applicationsQuery.isError ? (
        <ErrorState
          description="We could not load this application queue."
          onRetry={() => void applicationsQuery.refetch()}
        />
      ) : applicationsQuery.data.applications.length === 0 ? (
        <EmptyState
          title={`No ${status} applications`}
          description="Applications with this status will appear here."
        />
      ) : (
        <>
          <AdminApplicationList
            applications={applicationsQuery.data.applications}
            onOpen={setSelectedApplicationId}
          />
          <Pagination
            currentPage={page}
            pageSize={applicationsQuery.data.pagination.limit}
            totalItems={applicationsQuery.data.pagination.totalItems}
            onPageChange={setPage}
          />
        </>
      )}

      {selectedApplicationId && detailQuery.isPending && (
        <div className="sr-only" role="status" aria-live="polite">
          Loading application details…
        </div>
      )}

      {selectedApplicationId && detailQuery.isError && (
        <Notification
          title="Application details unavailable"
          message={getApiError(detailQuery.error).message}
          tone="error"
          onDismiss={() => setSelectedApplicationId(null)}
        />
      )}

      {detailQuery.data && (
        <AdminApplicationDetailDialog
          application={detailQuery.data}
          open={Boolean(selectedApplicationId)}
          isMutating={isMutating}
          onClose={() => setSelectedApplicationId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
