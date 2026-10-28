import type { ReactNode } from 'react'
import { StatusLabel, type StatusTone } from '../../../../components/ui/StatusLabel'
import type { AdminProductReviewDetails } from '../types'

interface AdminProductReviewContentProps {
  details: AdminProductReviewDetails
}

function ReviewAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <summary className="cursor-pointer px-5 py-4 font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
        {title}
      </summary>
      <div className="space-y-4 border-t border-border p-5">{children}</div>
    </details>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'

  if (typeof value === 'object') {
    return JSON.stringify(value) ?? String(value)
  }

  return String(value)
}

function formatDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString()
}

function getSellerStatusTone(
  status: NonNullable<AdminProductReviewDetails['seller']>['status'],
): StatusTone {
  if (status === 'active') return 'success'
  if (status === 'suspended') return 'error'
  if (status === 'pending_verification') return 'warning'
  return 'neutral'
}

function ProductGallery({ details }: AdminProductReviewContentProps) {
  const images = [...details.product.images].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  )

  return (
    <ReviewAccordion title={`Product images (${images.length})`} defaultOpen>
      {images.length === 0 ? (
        <p className="text-supporting text-text-secondary">No product images were submitted.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((image) => (
            <li
              key={`${image.sortOrder}-${image.secureUrl}`}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <a
                href={image.secureUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open full-size image: ${image.altText || 'Product image'}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="relative aspect-square bg-page">
                  <img
                    src={image.secureUrl}
                    alt={image.altText || details.product.name || 'Product image'}
                    loading="lazy"
                    className="size-full object-contain"
                  />
                  {image.isPrimary && (
                    <span className="absolute left-3 top-3">
                      <StatusLabel tone="information">Primary image</StatusLabel>
                    </span>
                  )}
                </div>
              </a>
              <p className="p-3 text-supporting text-text-secondary">
                {image.altText || 'No alt text'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ReviewAccordion>
  )
}

function ProductAttributes({ details }: AdminProductReviewContentProps) {
  const entries = Object.entries(details.product.attributes ?? {})

  if (entries.length === 0) {
    return <p className="text-supporting text-text-secondary">No product attributes provided.</p>
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => {
        const definition = details.category?.attributes.find((attribute) => attribute.slug === key)

        return (
          <div key={key} className="rounded-lg bg-page p-3">
            <dt className="text-supporting font-medium text-text-secondary">
              {definition?.name ?? key}
              {definition?.required ? ' · Required' : ''}
            </dt>
            <dd className="mt-1 wrap-break-word text-supporting text-text-primary">
              {formatValue(value)}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function ProductVariants({ details }: AdminProductReviewContentProps) {
  if (details.variants.length === 0) {
    return <p className="text-supporting text-text-secondary">No variants were submitted.</p>
  }

  const formatPrice = new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  })

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {details.variants.map((variant) => {
        const attributes = Object.entries(variant.attributes ?? {})

        return (
          <li key={variant.id} className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-text-primary">{variant.name}</h3>
                {variant.isDefault && (
                  <p className="mt-1 text-supporting text-text-secondary">Default variant</p>
                )}
              </div>
              <StatusLabel tone={variant.status === 'active' ? 'success' : 'neutral'}>
                {variant.status === 'active' ? 'Active' : 'Inactive'}
              </StatusLabel>
            </div>

            {attributes.length > 0 && (
              <dl className="grid grid-cols-2 gap-2 text-supporting">
                {attributes.map(([name, value]) => (
                  <div key={name}>
                    <dt className="text-text-secondary">{name}</dt>
                    <dd className="text-text-primary">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-supporting">
              <div>
                <dt className="text-text-secondary">SKU</dt>
                <dd className="mt-1 break-all text-text-primary">
                  {variant.sku || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Price</dt>
                <dd className="mt-1 text-text-primary">{formatPrice.format(variant.price)}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Stock quantity</dt>
                <dd className="mt-1 text-text-primary">{variant.stockQuantity.toLocaleString()}</dd>
              </div>
            </dl>
          </li>
        )
      })}
    </ul>
  )
}

/** Renders read-only product and seller information for moderation. */
export function AdminProductReviewContent({ details }: AdminProductReviewContentProps) {
  const { product, seller, store, category, brand } = details

  return (
    <div className="space-y-4">
      <ProductGallery details={details} />

      <ReviewAccordion title="Product information" defaultOpen>
        <dl className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <dt className="text-supporting text-text-secondary">Category</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {category?.name ?? 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt className="text-supporting text-text-secondary">Brand</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {brand?.name ?? 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-supporting text-text-secondary">Condition</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {product.condition === 'new'
                ? 'New'
                : product.condition === 'used'
                  ? 'Used'
                  : 'Not specified'}
            </dd>
          </div>
          {product.slug && (
            <div>
              <dt className="text-supporting text-text-secondary">Slug</dt>
              <dd className="mt-1 break-all text-supporting text-text-primary">{product.slug}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-supporting text-text-secondary">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-supporting text-text-primary">
              {product.description || 'No description provided.'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="mb-2 text-supporting text-text-secondary">Product attributes</dt>
            <ProductAttributes details={details} />
          </div>
        </dl>

        {product.options.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="font-semibold text-text-primary">Selectable options</h3>
            <ul className="mt-3 space-y-2">
              {product.options.map((option) => (
                <li key={option.name} className="text-supporting text-text-secondary">
                  <span className="font-medium text-text-primary">{option.name}:</span>{' '}
                  {option.values.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ReviewAccordion>

      <ReviewAccordion title={`Variants (${details.variants.length})`}>
        <ProductVariants details={details} />
      </ReviewAccordion>

      <ReviewAccordion title="Seller and store">
        <dl className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <dt className="text-supporting text-text-secondary">Seller</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {seller?.userName ?? 'Unavailable'}
            </dd>
            {seller && (
              <dd className="mt-2">
                <StatusLabel tone={getSellerStatusTone(seller.status)}>
                  {seller.status.replaceAll('_', ' ')}
                </StatusLabel>
              </dd>
            )}
          </div>
          <div>
            <dt className="text-supporting text-text-secondary">Store</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {store?.name ?? 'Unavailable'}
            </dd>
            {store && (
              <dd className="mt-2">
                <StatusLabel tone={store.status === 'active' ? 'success' : 'warning'}>
                  {store.status === 'active' ? 'Active' : 'Paused'}
                </StatusLabel>
              </dd>
            )}
          </div>
          <div>
            <dt className="text-supporting text-text-secondary">Category status</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {category?.status ?? 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt className="text-supporting text-text-secondary">Brand status</dt>
            <dd className="mt-1 text-supporting text-text-primary">
              {brand?.status ?? 'Unavailable'}
            </dd>
          </div>
        </dl>
      </ReviewAccordion>

      <ReviewAccordion title="Review checklist">
        <ul className="grid gap-2 rounded-xl border border-border bg-surface p-5 text-supporting text-text-secondary sm:grid-cols-2">
          <li>Check that product information is clear and complete.</li>
          <li>Check that category, brand, and attributes are appropriate.</li>
          <li>Inspect image quality and relevance.</li>
          <li>Review variant configurations, prices, and stock quantities.</li>
          <li>Consider seller and store eligibility information.</li>
        </ul>
        <p className="text-supporting text-text-secondary">
          This checklist is advisory and is not saved with the review.
        </p>
      </ReviewAccordion>

      <ReviewAccordion title={`Moderation history (${product.moderationHistory.length})`}>
        {product.moderationHistory.length === 0 ? (
          <p className="text-supporting text-text-secondary">No moderation history recorded.</p>
        ) : (
          <ol className="space-y-3">
            {product.moderationHistory.map((event, index) => (
              <li
                key={`${event.action}-${event.createdAt}-${index}`}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <p className="font-medium capitalize text-text-primary">
                  {event.action.replaceAll('_', ' ')}
                </p>
                <p className="mt-1 text-supporting text-text-secondary">
                  {formatDate(event.createdAt)}
                </p>
                {event.reason && (
                  <p className="mt-2 whitespace-pre-wrap text-supporting text-text-secondary">
                    {event.reason}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </ReviewAccordion>
    </div>
  )
}
