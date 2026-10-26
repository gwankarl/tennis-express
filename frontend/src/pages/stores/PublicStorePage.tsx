import { Link, useParams } from 'react-router'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusLabel } from '../../components/ui/StatusLabel'
import { usePublicStore } from '../../features/stores/hooks/usePublicStore'
import { getApiError } from '../../lib/apiError'

/** Displays public information for an active storefront. */
export default function PublicStorePage() {
  const { slug = '' } = useParams()
  const storeQuery = usePublicStore(slug)

  if (storeQuery.isPending) {
    return <LoadingState label="Loading storefront…" />
  }

  if (storeQuery.isError) {
    const apiError = getApiError(storeQuery.error)

    if (apiError.code === 'STORE_NOT_FOUND') {
      return (
        <EmptyState
          title="Storefront unavailable"
          description="This storefront could not be found or is not currently available."
          action={
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Return home
            </Link>
          }
        />
      )
    }

    return <ErrorState description={apiError.message} onRetry={() => void storeQuery.refetch()} />
  }

  const store = storeQuery.data

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <header className="overflow-hidden rounded-xl border border-border bg-surface">
        {store.logo && (
          <img
            src={store.logo.secureUrl}
            alt={`${store.name} logo`}
            className="h-56 w-full object-contain p-6 sm:h-72"
          />
        )}

        <div className="space-y-3 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-page-title font-bold text-text-primary">{store.name}</h1>
            <StatusLabel tone="success">Active</StatusLabel>
          </div>

          <p className="text-supporting text-text-secondary">
            {store.location.city}, {store.location.region}
          </p>
          <p className="whitespace-pre-wrap text-body text-text-primary">{store.description}</p>
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-section-heading font-semibold text-text-primary">Delivery</h2>
          {store.deliveryOptions.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {store.deliveryOptions.map((option, index) => (
                <li key={`${option.name}-${index}`} className="border-t border-border pt-3">
                  <h3 className="font-semibold text-text-primary">{option.name}</h3>
                  <p className="mt-1 text-supporting text-text-secondary">{option.description}</p>
                  <p className="mt-1 text-supporting text-text-primary">Fee: {option.fee}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-supporting text-text-secondary">
              No delivery options are listed.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-section-heading font-semibold text-text-primary">Collection</h2>
          {store.collectionOptions.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {store.collectionOptions.map((option, index) => (
                <li key={`${option.name}-${index}`} className="border-t border-border pt-3">
                  <h3 className="font-semibold text-text-primary">{option.name}</h3>
                  <p className="mt-1 text-supporting text-text-secondary">{option.description}</p>
                  <p className="mt-1 text-supporting text-text-primary">Fee: {option.fee}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-supporting text-text-secondary">
              No collection options are listed.
            </p>
          )}
        </div>
      </section>

      {store.returnPolicy && (
        <section className="rounded-xl border border-border bg-surface p-5">
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

      <p className="text-supporting text-text-secondary">
        {store.ratingSummary.totalReviews > 0
          ? `Rating: ${store.ratingSummary.averageRating} from ${store.ratingSummary.totalReviews} reviews`
          : 'This store has no reviews yet.'}
      </p>
    </article>
  )
}
