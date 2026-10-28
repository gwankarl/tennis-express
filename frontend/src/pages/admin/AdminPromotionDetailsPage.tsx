import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel'
import {
  useAdminPromotion,
  useCancelAdminPromotion,
} from '../../features/admin/promotions/hooks/useAdminPromotions'
import type { AdminPromotionStatus } from '../../features/admin/promotions/types'
import { getApiError } from '../../lib/apiError'

const statusTone: Record<AdminPromotionStatus, StatusTone> = {
  draft: 'neutral',
  scheduled: 'information',
  active: 'success',
  ended: 'neutral',
  cancelled: 'error',
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

/** Shows administrator details for a promotion and its eligible products. */
export default function AdminPromotionDetailsPage() {
  const { promotionId } = useParams()
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const promotionQuery = useAdminPromotion(promotionId ?? null)
  const cancelMutation = useCancelAdminPromotion(promotionId ?? '')

  if (!promotionId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Promotion details" />
        <ErrorState description="A promotion ID is required." />
      </div>
    )
  }

  if (promotionQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading title="Promotion details" />
        <LoadingState label="Loading promotion…" />
      </div>
    )
  }

  if (promotionQuery.isError || !promotionQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeading title="Promotion details" />
        <ErrorState
          title="Promotion could not be loaded"
          description={
            promotionQuery.isError
              ? getApiError(promotionQuery.error).message
              : 'The promotion could not be found.'
          }
          onRetry={() => void promotionQuery.refetch()}
        />
        <Link
          to="/admin/promotions"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to promotions
        </Link>
      </div>
    )
  }

  const promotion = promotionQuery.data
  const canCancel = ['draft', 'scheduled', 'active'].includes(promotion.status)

  const canEdit =
    promotion.type === 'marketplace_campaign' &&
    (promotion.status === 'draft' || promotion.status === 'scheduled')

  async function handleCancel() {
    setCancelError(null)

    try {
      await cancelMutation.mutateAsync()
      setIsCancelDialogOpen(false)
      setCancelSuccess(true)
    } catch (error) {
      setCancelError(getApiError(error).message)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/promotions"
        className="inline-flex min-h-11 items-center text-body font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Back to promotions
      </Link>

      <PageHeading
        title={promotion.name}
        description="Promotion schedule, ownership, and eligible products."
        action={
          canEdit || canCancel ? (
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Link
                  to={`/admin/promotions/${encodeURIComponent(promotion._id)}/edit`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Edit campaign
                </Link>
              )}

              {canCancel && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setCancelError(null)
                    setIsCancelDialogOpen(true)
                  }}
                >
                  Cancel promotion
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {cancelSuccess && (
        <Notification
          title="Promotion cancelled"
          message="The promotion status has been updated."
          tone="success"
          onDismiss={() => setCancelSuccess(false)}
        />
      )}

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Status</h2>
          <div className="mt-2">
            <StatusLabel tone={statusTone[promotion.status]}>{promotion.status}</StatusLabel>
          </div>
        </div>

        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Type</h2>
          <p className="mt-2 text-body text-text-primary">
            {promotion.type === 'marketplace_campaign' ? 'Marketplace campaign' : 'Seller discount'}
          </p>
        </div>

        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Discount</h2>
          <p className="mt-2 text-body font-semibold text-text-primary">
            {promotion.discountType === 'percentage'
              ? `${promotion.discountValue}%`
              : `Fixed amount: ${promotion.discountValue}`}
          </p>
        </div>

        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Starts</h2>
          <p className="mt-2 text-body text-text-primary">{formatDateTime(promotion.startsAt)}</p>
        </div>

        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Ends</h2>
          <p className="mt-2 text-body text-text-primary">{formatDateTime(promotion.endsAt)}</p>
        </div>

        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Created</h2>
          <p className="mt-2 text-body text-text-primary">{formatDateTime(promotion.createdAt)}</p>
        </div>

        {promotion.type === 'seller_discount' && (
          <>
            <div>
              <h2 className="text-form-label font-medium text-text-secondary">Seller</h2>
              <p className="mt-2 wrap-break-word text-body text-text-primary">
                {promotion.seller?.userName ?? 'Seller unavailable'}
              </p>
            </div>

            <div>
              <h2 className="text-form-label font-medium text-text-secondary">Store</h2>
              <p className="mt-2 wrap-break-word text-body text-text-primary">
                {promotion.store?.name ?? 'Store unavailable'}
              </p>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-card-heading font-semibold text-text-primary">Eligible products</h2>
          <p className="mt-1 text-supporting text-text-secondary">
            {promotion.eligibleProducts.length} product
            {promotion.eligibleProducts.length === 1 ? '' : 's'} in this promotion.
          </p>
        </div>

        {promotion.eligibleProducts.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-supporting text-text-secondary">
            No eligible product details are available.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {promotion.eligibleProducts.map((product) => (
              <li
                key={product.id}
                className="flex min-w-0 items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                {product.primaryImage ? (
                  <img
                    src={product.primaryImage.secureUrl}
                    alt={product.primaryImage.altText || product.name || 'Product image'}
                    loading="lazy"
                    className="size-16 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-page text-xs text-text-secondary"
                  >
                    Image unavailable
                  </div>
                )}

                <div className="min-w-0">
                  <p className="wrap-break-word font-medium text-text-primary">
                    {product.name ?? 'Product unavailable'}
                  </p>
                  <p className="mt-1 text-supporting text-text-secondary">
                    {product.moderationStatus ?? 'Unknown moderation status'} ·{' '}
                    {product.publicationStatus ?? 'Unknown publication status'}
                  </p>
                  {product.store && (
                    <p className="mt-1 truncate text-supporting text-text-secondary">
                      {product.store.name}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          if (cancelMutation.isPending && !open) return
          setIsCancelDialogOpen(open)
          if (open) setCancelError(null)
        }}
        title="Cancel this promotion?"
        description="This will stop the promotion. It cannot be reactivated through the current admin API."
      >
        <div className="space-y-4">
          {cancelError && (
            <Notification
              title="Promotion could not be cancelled"
              message={cancelError}
              tone="error"
            />
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Keep promotion
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={cancelMutation.isPending}
              onClick={() => void handleCancel()}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Confirm cancellation'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
