import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Notification } from '../../components/feedback/Notification'

import { Link, useParams, useSearchParams } from 'react-router'

import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel'
import {
  useAdminProduct,
  useApproveAdminProduct,
  useRejectAdminProduct,
  useRequestAdminProductChanges,
} from '../../features/admin/products/hooks/useAdminProductModeration'
import type { AdminProductReviewDetails } from '../../features/admin/products/types'
import { getApiError } from '../../lib/apiError'
import { AdminProductReviewContent } from '../../features/admin/products/components/AdminProductReviewContent'

type ModerationStatus = AdminProductReviewDetails['product']['moderationStatus']
type PublicationStatus = AdminProductReviewDetails['product']['publicationStatus']

const moderationStatusDisplay: Record<ModerationStatus, { label: string; tone: StatusTone }> = {
  not_submitted: { label: 'Not submitted', tone: 'neutral' },
  pending: { label: 'Pending review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
  changes_requested: { label: 'Changes requested', tone: 'information' },
}

const publicationStatusDisplay: Record<PublicationStatus, { label: string; tone: StatusTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
}

function formatDate(value: string | null): string {
  if (!value) return 'Not available'

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString()
}

/** Displays the review workspace and summary for one product. */
export default function AdminProductReviewPage() {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams] = useSearchParams()
  const productQuery = useAdminProduct(productId ?? null)

  const approveMutation = useApproveAdminProduct()

  const requestChangesMutation = useRequestAdminProductChanges()
  const [changesDialogOpen, setChangesDialogOpen] = useState(false)
  const [changesReason, setChangesReason] = useState('')
  const [changesError, setChangesError] = useState<string | null>(null)

  const rejectMutation = useRejectAdminProduct()
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionError, setRejectionError] = useState<string | null>(null)

  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    title: string
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  const handleApprove = () => {
    if (!productId || approveMutation.isPending) return

    setApprovalError(null)

    approveMutation.mutate(productId, {
      onSuccess: () => {
        setApprovalDialogOpen(false)
        setNotice({
          title: 'Product approved',
          message: 'Moderation approval is complete. The product has not been published.',
          tone: 'success',
        })
      },
      onError: (error) => {
        const apiError = getApiError(error)

        if (apiError.code === 'PRODUCT_NOT_PENDING' || apiError.code === 'PRODUCT_NOT_FOUND') {
          setApprovalDialogOpen(false)
          setNotice({
            title: 'Product status changed',
            message:
              'The product may have been reviewed by another administrator. Its current details are being refreshed.',
            tone: 'error',
          })
          void productQuery.refetch()
          return
        }

        setApprovalError(apiError.message)
      },
    })
  }

  const handleRequestChanges = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!productId || requestChangesMutation.isPending) return

    const reason = changesReason.trim()

    if (reason.length < 20 || reason.length > 1000) {
      setChangesError('Enter a reason between 20 and 1,000 characters.')
      return
    }

    setChangesError(null)

    requestChangesMutation.mutate(
      { productId, reason },
      {
        onSuccess: () => {
          setChangesDialogOpen(false)
          setChangesReason('')
          setNotice({
            title: 'Changes requested',
            message: 'Your feedback was sent to the seller.',
            tone: 'success',
          })
        },
        onError: (error) => {
          const apiError = getApiError(error)

          if (apiError.code === 'PRODUCT_NOT_PENDING' || apiError.code === 'PRODUCT_NOT_FOUND') {
            setChangesDialogOpen(false)
            setNotice({
              title: 'Product status changed',
              message:
                'The product may have been reviewed by another administrator. Its current details are being refreshed.',
              tone: 'error',
            })
            void productQuery.refetch()
            return
          }

          setChangesError(apiError.message)
        },
      },
    )
  }

  const handleReject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!productId || rejectMutation.isPending) return

    const reason = rejectionReason.trim()

    if (reason.length < 20 || reason.length > 1000) {
      setRejectionError('Enter a rejection reason between 20 and 1,000 characters.')
      return
    }

    setRejectionError(null)

    rejectMutation.mutate(
      { productId, reason },
      {
        onSuccess: () => {
          setRejectionDialogOpen(false)
          setRejectionReason('')
          setNotice({
            title: 'Product rejected',
            message: 'The rejection reason was saved and sent to the seller.',
            tone: 'success',
          })
        },
        onError: (error) => {
          const apiError = getApiError(error)

          if (apiError.code === 'PRODUCT_NOT_PENDING' || apiError.code === 'PRODUCT_NOT_FOUND') {
            setRejectionDialogOpen(false)
            setNotice({
              title: 'Product status changed',
              message:
                'The product may have been reviewed by another administrator. Its current details are being refreshed.',
              tone: 'error',
            })
            void productQuery.refetch()
            return
          }

          setRejectionError(apiError.message)
        },
      },
    )
  }

  const queueQuery = searchParams.toString()
  const backToQueue = queueQuery ? `/admin/products?${queueQuery}` : '/admin/products'

  if (!productId) {
    return (
      <ErrorState
        title="Product unavailable"
        description="A product ID is required to open the review workspace."
      />
    )
  }

  if (productQuery.isPending) {
    return <LoadingState label="Loading product review…" />
  }

  if (productQuery.isError) {
    return (
      <ErrorState
        title="Could not load product"
        description={getApiError(productQuery.error).message}
        onRetry={() => void productQuery.refetch()}
      />
    )
  }

  const { product, seller, store } = productQuery.data
  const moderationStatus = moderationStatusDisplay[product.moderationStatus]
  const publicationStatus = publicationStatusDisplay[product.publicationStatus]

  return (
    <div className="space-y-6">
      {notice && (
        <Notification
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
          onDismiss={() => setNotice(null)}
        />
      )}
      <Link
        to={backToQueue}
        className="inline-flex min-h-11 items-center rounded-md text-supporting font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        ← Back to moderation queue
      </Link>

      <PageHeading
        title={product.name || 'Untitled product'}
        description={`Seller: ${seller?.userName ?? 'Unavailable'} · Store: ${store?.name ?? 'Unavailable'}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <main className="min-w-0 space-y-6">
          <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-card-heading font-semibold text-text-primary">
              Submission overview
            </h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-supporting text-text-secondary">Moderation status</dt>
                <dd className="mt-1">
                  <StatusLabel tone={moderationStatus.tone}>{moderationStatus.label}</StatusLabel>
                </dd>
              </div>

              <div>
                <dt className="text-supporting text-text-secondary">Publication status</dt>
                <dd className="mt-1">
                  <StatusLabel tone={publicationStatus.tone}>{publicationStatus.label}</StatusLabel>
                </dd>
              </div>

              <div>
                <dt className="text-supporting text-text-secondary">Submitted</dt>
                <dd className="mt-1 text-supporting text-text-primary">
                  {formatDate(product.submittedAt)}
                </dd>
              </div>

              <div>
                <dt className="text-supporting text-text-secondary">Last reviewed</dt>
                <dd className="mt-1 text-supporting text-text-primary">
                  {formatDate(product.reviewedAt)}
                </dd>
              </div>
            </dl>
          </section>

          <AdminProductReviewContent details={productQuery.data} />
        </main>

        <aside className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-card-heading font-semibold text-text-primary">Review status</h2>

          <p className="text-supporting text-text-secondary">
            Moderation approval and publication are separate product states.
          </p>

          {product.moderationReason && (
            <div className="space-y-1 border-t border-border pt-4">
              <h3 className="text-supporting font-semibold text-text-primary">
                Previous review feedback
              </h3>
              <p className="whitespace-pre-wrap text-supporting text-text-secondary">
                {product.moderationReason}
              </p>
            </div>
          )}

          {product.reviewedAt && (
            <p className="border-t border-border pt-4 text-supporting text-text-secondary">
              Reviewed {formatDate(product.reviewedAt)}
            </p>
          )}

          {product.moderationStatus === 'pending' && (
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-supporting text-text-secondary">
                Approving confirms that the product passed moderation. It does not publish the
                listing.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    approveMutation.isPending ||
                    requestChangesMutation.isPending ||
                    rejectMutation.isPending
                  }
                  onClick={() => {
                    setChangesError(null)
                    setChangesDialogOpen(true)
                  }}
                >
                  Request Changes
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  disabled={
                    approveMutation.isPending ||
                    requestChangesMutation.isPending ||
                    rejectMutation.isPending
                  }
                  onClick={() => {
                    setRejectionError(null)
                    setRejectionDialogOpen(true)
                  }}
                >
                  Reject Product
                </Button>

                <Button
                  type="button"
                  disabled={
                    approveMutation.isPending ||
                    requestChangesMutation.isPending ||
                    rejectMutation.isPending
                  }
                  onClick={() => {
                    setApprovalError(null)
                    setApprovalDialogOpen(true)
                  }}
                >
                  Approve Product
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Dialog
        open={approvalDialogOpen}
        onOpenChange={(open) => {
          if (!approveMutation.isPending) {
            setApprovalDialogOpen(open)
            if (open) setApprovalError(null)
          }
        }}
        title="Approve this product?"
        description="Approval records that the listing passed moderation. The seller must still publish it separately."
      >
        {approvalError && (
          <div className="mb-4">
            <Notification
              title="Approval could not be saved"
              message={approvalError}
              tone="error"
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={approveMutation.isPending}
            onClick={() => setApprovalDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={approveMutation.isPending} onClick={handleApprove}>
            {approveMutation.isPending ? 'Approving…' : 'Confirm approval'}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={changesDialogOpen}
        onOpenChange={(open) => {
          if (!requestChangesMutation.isPending) {
            setChangesDialogOpen(open)
            setChangesError(null)
            if (!open) setChangesReason('')
          }
        }}
        title="Request changes to this product"
        description="Give the seller clear feedback about what needs to be changed before resubmitting."
      >
        <form onSubmit={handleRequestChanges} className="space-y-4">
          {changesError && (
            <Notification
              title="Changes request could not be saved"
              message={changesError}
              tone="error"
            />
          )}

          <div>
            <label
              htmlFor="changes-reason"
              className="mb-1 block text-supporting font-medium text-text-primary"
            >
              Feedback for the seller
            </label>
            <textarea
              id="changes-reason"
              name="reason"
              required
              minLength={20}
              maxLength={1000}
              rows={5}
              value={changesReason}
              onChange={(event) => {
                setChangesReason(event.target.value)
                setChangesError(null)
              }}
              aria-describedby="changes-reason-help changes-reason-count"
              aria-invalid={Boolean(changesError)}
              className="w-full rounded-md border border-border bg-surface p-3 text-supporting text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Describe the changes the seller needs to make."
            />
            <div className="mt-1 flex justify-between gap-3 text-supporting text-text-secondary">
              <span id="changes-reason-help">Enter 20–1,000 characters.</span>
              <span id="changes-reason-count" aria-live="polite">
                {changesReason.trim().length}/1,000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={requestChangesMutation.isPending}
              onClick={() => {
                setChangesDialogOpen(false)
                setChangesReason('')
                setChangesError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                requestChangesMutation.isPending ||
                changesReason.trim().length < 20 ||
                changesReason.trim().length > 1000
              }
            >
              {requestChangesMutation.isPending ? 'Sending…' : 'Send feedback'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={rejectionDialogOpen}
        onOpenChange={(open) => {
          if (!rejectMutation.isPending) {
            setRejectionDialogOpen(open)
            setRejectionError(null)
            if (!open) setRejectionReason('')
          }
        }}
        title="Reject this product?"
        description="The seller will receive this reason. Rejection is a moderation decision and will not delete the product."
      >
        <form onSubmit={handleReject} className="space-y-4">
          {rejectionError && (
            <Notification
              title="Rejection could not be saved"
              message={rejectionError}
              tone="error"
            />
          )}

          <div>
            <label
              htmlFor="rejection-reason"
              className="mb-1 block text-supporting font-medium text-text-primary"
            >
              Rejection reason
            </label>
            <textarea
              id="rejection-reason"
              name="reason"
              required
              minLength={20}
              maxLength={1000}
              rows={5}
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value)
                setRejectionError(null)
              }}
              aria-describedby="rejection-reason-help rejection-reason-count"
              aria-invalid={Boolean(rejectionError)}
              className="w-full rounded-md border border-border bg-surface p-3 text-supporting text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Explain why this product cannot be approved."
            />
            <div className="mt-1 flex justify-between gap-3 text-supporting text-text-secondary">
              <span id="rejection-reason-help">Enter 20–1,000 characters.</span>
              <span id="rejection-reason-count" aria-live="polite">
                {rejectionReason.trim().length}/1,000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={rejectMutation.isPending}
              onClick={() => {
                setRejectionDialogOpen(false)
                setRejectionReason('')
                setRejectionError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={
                rejectMutation.isPending ||
                rejectionReason.trim().length < 20 ||
                rejectionReason.trim().length > 1000
              }
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Confirm rejection'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
