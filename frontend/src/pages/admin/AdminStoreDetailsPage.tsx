import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { StatusLabel } from '../../components/ui/StatusLabel'
import {
  useAdminStore,
  useUpdateAdminStoreStatus,
} from '../../features/admin/stores/hooks/useAdminStores'
import type { AdminStoreStatus } from '../../features/admin/stores/types'
import { getApiError } from '../../lib/apiError'

/** Displays full administrative details and status controls for one store. */
export default function AdminStoreDetailsPage() {
  const { storeId } = useParams()
  const storeQuery = useAdminStore(storeId ?? null)
  const statusMutation = useUpdateAdminStoreStatus()
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (storeQuery.isPending) {
    return <LoadingState label="Loading store details…" />
  }

  if (storeQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Store details" />
        <ErrorState
          description={getApiError(storeQuery.error).message}
          onRetry={() => void storeQuery.refetch()}
        />
      </div>
    )
  }

  const store = storeQuery.data
  const nextStatus: AdminStoreStatus = store.status === 'active' ? 'paused' : 'active'

  const handleConfirmStatusChange = async () => {
    setStatusError(null)

    try {
      await statusMutation.mutateAsync({
        storeId: store.id,
        status: nextStatus,
      })
      setIsConfirmingStatus(false)
      setNotice(`Store status changed to ${nextStatus}.`)
    } catch (error) {
      setStatusError(getApiError(error).message)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/stores"
        className="inline-flex min-h-11 items-center text-body font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Back to store management
      </Link>

      <PageHeading
        title={store.name}
        description={`Store details for ${store.slug}.`}
        action={
          <Button
            type="button"
            variant={store.status === 'active' ? 'danger' : 'primary'}
            onClick={() => {
              setStatusError(null)
              setIsConfirmingStatus(true)
            }}
          >
            {store.status === 'active' ? 'Pause store' : 'Activate store'}
          </Button>
        }
      />

      {notice && (
        <Notification
          title="Store status updated"
          message={notice}
          tone="success"
          onDismiss={() => setNotice(null)}
        />
      )}

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-5">
          {store.logo && (
            <img
              src={store.logo.secureUrl}
              alt={`${store.name} logo`}
              className="size-24 rounded-lg border border-border object-contain p-2"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-section-heading font-semibold text-text-primary">
                Store overview
              </h2>
              <StatusLabel tone={store.status === 'active' ? 'success' : 'warning'}>
                {store.status}
              </StatusLabel>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-form-label font-medium text-text-secondary">Slug</dt>
                <dd className="mt-1 break-all text-body text-text-primary">{store.slug}</dd>
              </div>
              <div>
                <dt className="text-form-label font-medium text-text-secondary">Seller ID</dt>
                <dd className="mt-1 break-all text-body text-text-primary">{store.sellerId}</dd>
              </div>
              <div>
                <dt className="text-form-label font-medium text-text-secondary">Location</dt>
                <dd className="mt-1 text-body text-text-primary">
                  {store.location.address}, {store.location.city}, {store.location.region}
                </dd>
              </div>
              <div>
                <dt className="text-form-label font-medium text-text-secondary">Rating</dt>
                <dd className="mt-1 text-body text-text-primary">
                  {store.ratingSummary.totalReviews > 0
                    ? `${store.ratingSummary.averageRating} from ${store.ratingSummary.totalReviews} reviews`
                    : 'No reviews yet'}
                </dd>
              </div>
            </dl>

            {store.status === 'active' && (
              <a
                href={`/stores/${encodeURIComponent(store.slug)}`}
                className="mt-4 inline-flex min-h-11 items-center text-body font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Open public storefront
              </a>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <h3 className="text-card-heading font-semibold text-text-primary">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-body text-text-secondary">
            {store.description}
          </p>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-form-label font-medium text-text-secondary">Created</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {new Date(store.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-form-label font-medium text-text-secondary">Last updated</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {new Date(store.updatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>

      {store.fulfilmentProfile && (
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-section-heading font-semibold text-text-primary">Fulfilment</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-form-label font-medium text-text-secondary">Methods</dt>
              <dd className="mt-1 text-body text-text-primary">
                {store.fulfilmentProfile.methods.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-form-label font-medium text-text-secondary">Service regions</dt>
              <dd className="mt-1 text-body text-text-primary">
                {store.fulfilmentProfile.serviceRegions.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-form-label font-medium text-text-secondary">Dispatch time</dt>
              <dd className="mt-1 text-body text-text-primary">
                {store.fulfilmentProfile.dispatchTime.replaceAll('_', ' ')}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <StoreOptionsSection title="Delivery options" options={store.deliveryOptions} />
        <StoreOptionsSection title="Collection options" options={store.collectionOptions} />
      </div>

      {store.returnPolicy && (
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-section-heading font-semibold text-text-primary">Return policy</h2>
          <p className="mt-3 text-body text-text-primary">{store.returnPolicy.summary}</p>
          <p className="mt-2 text-supporting text-text-secondary">
            Return window: {store.returnPolicy.returnWindowDays} days
          </p>
          {store.returnPolicy.conditions.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-supporting text-text-secondary">
              {store.returnPolicy.conditions.map((condition, index) => (
                <li key={`${condition}-${index}`}>{condition}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Dialog
        open={isConfirmingStatus}
        onOpenChange={(open) => {
          if (statusMutation.isPending) return
          setIsConfirmingStatus(open)
          if (!open) setStatusError(null)
        }}
        title={nextStatus === 'paused' ? 'Pause this store?' : 'Activate this store?'}
        description={
          nextStatus === 'paused'
            ? 'Customers will no longer be able to access this public storefront.'
            : 'The backend will verify that the seller account is active and approved before reactivating this store.'
        }
      >
        <div className="space-y-4">
          {statusError && (
            <Notification
              title="Store status could not be changed"
              message={statusError}
              tone="error"
              onDismiss={() => setStatusError(null)}
            />
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() => {
                setIsConfirmingStatus(false)
                setStatusError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={nextStatus === 'paused' ? 'danger' : 'primary'}
              disabled={statusMutation.isPending}
              onClick={() => void handleConfirmStatusChange()}
            >
              {statusMutation.isPending
                ? 'Updating…'
                : nextStatus === 'paused'
                  ? 'Pause store'
                  : 'Activate store'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

interface StoreOptionsSectionProps {
  title: string
  options: Array<{
    name: string
    description: string
    fee: number
  }>
}

/** Displays seller-defined delivery or collection options. */
function StoreOptionsSection({ title, options }: StoreOptionsSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-section-heading font-semibold text-text-primary">{title}</h2>
      {options.length === 0 ? (
        <p className="mt-3 text-supporting text-text-secondary">No options provided.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {options.map((option, index) => (
            <li key={`${option.name}-${index}`} className="border-t border-border pt-3">
              <h3 className="font-semibold text-text-primary">{option.name}</h3>
              <p className="mt-1 text-supporting text-text-secondary">{option.description}</p>
              <p className="mt-1 text-supporting text-text-primary">Fee: {option.fee}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
