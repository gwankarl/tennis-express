import { useQueries } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { useState } from 'react'

import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel'
import { Notification } from '../../components/feedback/Notification'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { getSellerProduct } from '../../features/sellers/products/api/sellerProducts'
import { sellerProductDetailQueryKey } from '../../features/sellers/products/hooks/useSellerProducts'
import {
  useSellerPromotion,
  useCancelSellerPromotion,
} from '../../features/sellers/promotions/hooks/useSellerPromotions'
import type { SellerPromotionStatus } from '../../features/sellers/promotions/types'
import { getApiError } from '../../lib/apiError'

const statusLabels: Record<SellerPromotionStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  ended: 'Ended',
  cancelled: 'Cancelled',
}

const statusTones: Record<SellerPromotionStatus, StatusTone> = {
  draft: 'neutral',
  scheduled: 'information',
  active: 'success',
  ended: 'neutral',
  cancelled: 'warning',
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

/** Shows the details and eligible products for one seller-owned promotion. */
export default function SellerPromotionDetailsPage() {
  const { promotionId } = useParams()
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const cancelMutation = useCancelSellerPromotion(promotionId ?? '')

  async function handleCancelPromotion() {
    setCancelError(null)
    setCancelSuccess(false)

    try {
      await cancelMutation.mutateAsync()
      setIsCancelDialogOpen(false)
      setCancelSuccess(true)
    } catch (error) {
      setCancelError(getApiError(error).message)
    }
  }
  const promotionQuery = useSellerPromotion(promotionId ?? '')

  const productIds = promotionQuery.data?.eligibleProductIds ?? []

  const productQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: sellerProductDetailQueryKey(productId),
      queryFn: () => getSellerProduct(productId),
    })),
  })

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
        <div className="flex flex-wrap gap-3">
          <Link
            to="/seller/promotions"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Back to promotions
          </Link>
        </div>
      </div>
    )
  }

  const promotion = promotionQuery.data

  return (
    <div className="space-y-6">
      <PageHeading
        title={promotion.name}
        description="Promotion details, schedule, and eligible products."
      />
      {cancelSuccess && (
        <Notification
          title="Promotion cancelled"
          message="The promotion status has been updated."
          tone="success"
          onDismiss={() => setCancelSuccess(false)}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to="/seller/promotions"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to promotions
        </Link>

        {(promotion.status === 'draft' || promotion.status === 'scheduled') && (
          <Link
            to={`/seller/promotions/${encodeURIComponent(promotion._id)}/edit`}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Edit promotion
          </Link>
        )}

        {['draft', 'scheduled', 'active'].includes(promotion.status) && (
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
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Status</h2>
          <div className="mt-2">
            <StatusLabel tone={statusTones[promotion.status]}>
              {statusLabels[promotion.status]}
            </StatusLabel>
          </div>
        </div>

        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Discount</h2>
          <p className="mt-2 text-body font-semibold text-text-primary">
            {promotion.discountType === 'percentage'
              ? `${promotion.discountValue}% off`
              : `${promotion.discountValue} fixed amount`}
          </p>
        </div>

        <div>
          <h2 className="text-form-label font-medium text-text-secondary">Eligible products</h2>
          <p className="mt-2 text-body text-text-primary">{promotion.eligibleProductIds.length}</p>
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
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-card-heading font-semibold text-text-primary">Eligible products</h2>
          <p className="mt-1 text-supporting text-text-secondary">
            Product names and images are loaded from your seller product records.
          </p>
        </div>

        {productIds.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-supporting text-text-secondary">
            No eligible product IDs were returned for this promotion.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {productIds.map((productId, index) => {
              const productQuery = productQueries[index]
              const product = productQuery?.data
              const primaryImage = product?.images.find((image) => image.isPrimary)
              const image = primaryImage ?? product?.images[0]

              return (
                <li
                  key={productId}
                  className="flex min-w-0 items-center gap-4 rounded-xl border border-border bg-surface p-4"
                >
                  {image ? (
                    <img
                      src={image.secureUrl}
                      alt={image.altText || product?.name || 'Product image'}
                      className="size-16 shrink-0 rounded-lg object-cover"
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
                    {productQuery?.isPending ? (
                      <p className="text-body text-text-secondary">Loading product…</p>
                    ) : product ? (
                      <>
                        <p className="truncate text-body font-medium text-text-primary">
                          {product.name || 'Unnamed product'}
                        </p>
                        <p className="mt-1 text-supporting text-text-secondary">
                          {product.publicationStatus} · {product.moderationStatus}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-body font-medium text-text-primary">
                          Product details unavailable
                        </p>
                        <p className="mt-1 break-all text-supporting text-text-secondary">
                          {productId}
                        </p>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          if (cancelMutation.isPending && !open) return

          setIsCancelDialogOpen(open)

          if (open) {
            setCancelError(null)
          }
        }}
        title="Cancel this promotion?"
        description="This action cannot be undone through the seller promotion API."
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
              onClick={() => void handleCancelPromotion()}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Confirm cancellation'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
