import { useState } from 'react'
import { Link } from 'react-router'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { StatusLabel } from '../../components/ui/StatusLabel'
import { SellerStoreDetailsForm } from '../../features/sellers/store/components/SellerStoreDetailsForm'
import { SellerStoreLogoForm } from '../../features/sellers/store/components/SellerStoreLogoForm'
import {
  useSellerStore,
  useUpdateSellerStore,
  useUpdateSellerStoreStatus,
  useUploadSellerStoreLogo,
} from '../../features/sellers/store/hooks/useSellerStore'
import type {
  SellerStoreStatus,
  UpdateSellerStoreRequest,
} from '../../features/sellers/store/types'
import { Dialog } from '../../components/ui/Dialog'
import { getApiError } from '../../lib/apiError'

/** Shows and edits the authenticated seller's storefront details. */
export default function SellerStorePage() {
  const storeQuery = useSellerStore()

  const updateMutation = useUpdateSellerStore()
  const logoMutation = useUploadSellerStoreLogo()

  const statusMutation = useUpdateSellerStoreStatus()
  const [statusToSet, setStatusToSet] = useState<SellerStoreStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleUploadLogo = async (file: File) => {
    await logoMutation.mutateAsync(file)
  }

  const handleSaveDetails = async (changes: UpdateSellerStoreRequest) => {
    await updateMutation.mutateAsync(changes)
    setIsEditingDetails(false)
    setNotice('Your store details have been saved.')
  }

  const handleConfirmStatusChange = async () => {
    if (!statusToSet) return

    setStatusError(null)

    try {
      await statusMutation.mutateAsync(statusToSet)
      setStatusToSet(null)
      setNotice(
        statusToSet === 'active'
          ? 'Your storefront is now active.'
          : 'Your storefront has been paused.',
      )
    } catch (error) {
      setStatusError(getApiError(error).message)
    }
  }

  if (storeQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="My Storefront"
          description="Manage the public store customers see when they browse your products."
        />
        <LoadingState label="Loading your storefront…" />
      </div>
    )
  }

  if (storeQuery.isError) {
    const apiError = getApiError(storeQuery.error)

    if (apiError.code === 'STORE_NOT_FOUND') {
      return (
        <div className="space-y-6">
          <PageHeading
            title="My Storefront"
            description="Manage the public store customers see when they browse your products."
          />
          <EmptyState
            title="Storefront unavailable"
            description="Your seller account does not currently have a storefront to manage."
          />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <PageHeading
          title="My Storefront"
          description="Manage the public store customers see when they browse your products."
        />
        <ErrorState description={apiError.message} onRetry={() => void storeQuery.refetch()} />
      </div>
    )
  }

  const store = storeQuery.data

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Storefront"
        description="Manage the public store customers see when they browse your products."
      />

      {notice && (
        <Notification
          title="Store updated"
          message={notice}
          tone="success"
          onDismiss={() => setNotice(null)}
        />
      )}

      <section
        aria-labelledby="store-overview-heading"
        className="rounded-xl border border-border bg-surface p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="store-overview-heading"
              className="text-section-heading font-semibold text-text-primary"
            >
              Store overview
            </h2>
            <p className="mt-2 wrap-break-word text-body font-medium text-text-primary">
              {store.name}
            </p>
            <p className="mt-1 break-all text-supporting text-text-secondary">
              Store URL: /stores/{store.slug}
            </p>
          </div>

          <StatusLabel tone={store.status === 'active' ? 'success' : 'warning'}>
            {store.status === 'active' ? 'Active' : 'Paused'}
          </StatusLabel>
        </div>

        <div className="mt-5">
          <Link
            to={`/stores/${encodeURIComponent(store.slug)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 py-2 text-body font-medium text-primary transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Preview public storefront
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="store-details-heading"
        className="rounded-xl border border-border bg-surface p-5 sm:p-6"
      >
        {isEditingDetails ? (
          <SellerStoreDetailsForm
            key={store._id}
            store={store}
            isSaving={updateMutation.isPending}
            onCancel={() => setIsEditingDetails(false)}
            onSave={handleSaveDetails}
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2
                id="store-details-heading"
                className="text-section-heading font-semibold text-text-primary"
              >
                Store details
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNotice(null)
                  setIsEditingDetails(true)
                }}
              >
                Edit details
              </Button>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-form-label font-medium text-text-secondary">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-body text-text-primary">
                  {store.description}
                </dd>
              </div>
              <div>
                <dt className="text-form-label font-medium text-text-secondary">
                  Operating location
                </dt>
                <dd className="mt-1 text-body text-text-primary">
                  {store.location.address}, {store.location.city}, {store.location.region}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <SellerStoreLogoForm
          store={store}
          isUploading={logoMutation.isPending}
          onUpload={handleUploadLogo}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-section-heading font-semibold text-text-primary">
              Store availability
            </h2>
            <p className="mt-1 text-supporting text-text-secondary">
              {store.status === 'active'
                ? 'Your storefront is active and available to customers.'
                : 'Your storefront is paused and unavailable to customers.'}
            </p>
          </div>

          <Button
            type="button"
            variant={store.status === 'active' ? 'danger' : 'primary'}
            onClick={() => {
              setStatusError(null)
              setStatusToSet(store.status === 'active' ? 'paused' : 'active')
            }}
          >
            {store.status === 'active' ? 'Pause storefront' : 'Activate storefront'}
          </Button>
        </div>
      </section>

      <Dialog
        open={statusToSet !== null}
        onOpenChange={(open) => {
          if (statusMutation.isPending) return
          if (!open) {
            setStatusToSet(null)
            setStatusError(null)
          }
        }}
        title={statusToSet === 'paused' ? 'Pause your storefront?' : 'Activate your storefront?'}
        description={
          statusToSet === 'paused'
            ? 'Customers will no longer be able to access your public storefront while it is paused.'
            : 'Your public storefront will become available to customers.'
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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() => {
                setStatusToSet(null)
                setStatusError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={statusToSet === 'paused' ? 'danger' : 'primary'}
              disabled={statusMutation.isPending || statusToSet === null}
              onClick={() => void handleConfirmStatusChange()}
            >
              {statusMutation.isPending
                ? 'Updating…'
                : statusToSet === 'paused'
                  ? 'Pause storefront'
                  : 'Activate storefront'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
