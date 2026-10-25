import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import {
  getSellerApplicationHistory,
  sellerApplicationHistoryQueryKey,
} from '../../features/seller-applications/api/sellerApplications'
import { SellerApplicationForm } from '../../features/seller-applications/components/SellerApplicationForm'
import { SellerApplicationHistoryItem } from '../../features/seller-applications/components/SellerApplicationHistoryItem'
import type { SellerApplication } from '../../features/seller-applications/types'

const pageSize = 20

/** Displays seller application history and lets customers submit or resubmit. */
export default function SellerApplicationsPage() {
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [rejectedApplication, setRejectedApplication] = useState<SellerApplication | undefined>()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const historyQuery = useQuery({
    queryKey: sellerApplicationHistoryQueryKey(page, pageSize),
    queryFn: () => getSellerApplicationHistory(page, pageSize),
  })

  const startNewApplication = () => {
    setRejectedApplication(undefined)
    setSuccessMessage(null)
    setFormOpen(true)
  }

  const startResubmission = (application: SellerApplication) => {
    setRejectedApplication(application)
    setSuccessMessage(null)
    setFormOpen(true)
  }

  const handleSuccess = () => {
    setFormOpen(false)
    setRejectedApplication(undefined)
    setPage(1)
    setSuccessMessage('Your seller application was submitted successfully.')
  }

  if (historyQuery.isPending) {
    return <LoadingState label="Loading your seller applications…" />
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        description="We could not load your application history."
        onRetry={() => void historyQuery.refetch()}
      />
    )
  }

  const { applications, pagination } = historyQuery.data
  const latestApplication = applications[0]
  const hasPendingApplication = applications.some((application) => application.status === 'pending')

  return (
    <div className="space-y-6">
      <PageHeading
        title="Seller applications"
        description="Review your application history or apply to sell on Tennis-Xpress."
        action={
          !formOpen && !hasPendingApplication ? (
            <Button onClick={startNewApplication}>Apply to become a seller</Button>
          ) : undefined
        }
      />

      {successMessage && (
        <Notification title="Application submitted" message={successMessage} tone="success" />
      )}

      {formOpen ? (
        <SellerApplicationForm
          key={rejectedApplication?._id ?? 'new-application'}
          rejectedApplication={rejectedApplication}
          onCancel={() => setFormOpen(false)}
          onSuccess={handleSuccess}
        />
      ) : (
        <>
          {hasPendingApplication && (
            <Notification
              title="Application under review"
              message="You already have a pending application. You can follow its status below."
              tone="information"
            />
          )}

          {latestApplication?.status === 'approved' && (
            <Notification
              title="Application approved"
              message="Your latest seller application was approved."
              tone="success"
            />
          )}

          {applications.length === 0 ? (
            <EmptyState
              title="No seller applications yet"
              description="Submit an application to request access to seller features."
              action={<Button onClick={startNewApplication}>Start an application</Button>}
            />
          ) : (
            <section className="space-y-4" aria-label="Application history">
              {applications.map((application) => (
                <SellerApplicationHistoryItem
                  key={application._id}
                  application={application}
                  onResubmit={startResubmission}
                />
              ))}
            </section>
          )}

          <Pagination
            currentPage={page}
            pageSize={pagination.limit}
            totalItems={pagination.totalItems}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
