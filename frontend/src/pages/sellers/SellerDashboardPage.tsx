import { Link } from 'react-router'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel'
import { useSellerPromotions } from '../../features/sellers/promotions/hooks/useSellerPromotions'
import type { SellerPromotionStatus } from '../../features/sellers/promotions/types'
import { useSellerProducts } from '../../features/sellers/products/hooks/useSellerProducts'
import type {
  ProductModerationStatus,
  ProductPublicationStatus,
  SellerProduct,
} from '../../features/sellers/products/types'
import { getApiError } from '../../lib/apiError'

const PRODUCT_PREVIEW_LIMIT = 5
const PROMOTION_PREVIEW_LIMIT = 3

const moderationLabels: Record<ProductModerationStatus, string> = {
  not_submitted: 'Not submitted',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
}

const moderationTones: Record<ProductModerationStatus, StatusTone> = {
  not_submitted: 'neutral',
  pending: 'information',
  approved: 'success',
  rejected: 'error',
  changes_requested: 'warning',
}

const publicationLabels: Record<ProductPublicationStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

const publicationTones: Record<ProductPublicationStatus, StatusTone> = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning',
}

const promotionLabels: Record<SellerPromotionStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  ended: 'Ended',
  cancelled: 'Cancelled',
}

const promotionTones: Record<SellerPromotionStatus, StatusTone> = {
  draft: 'neutral',
  scheduled: 'information',
  active: 'success',
  ended: 'neutral',
  cancelled: 'warning',
}

const linkClasses =
  'inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

function formatDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function ProductPreview({ product }: { product: SellerProduct }) {
  const image = product.images.find((item) => item.isPrimary) ?? product.images[0]

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border p-3">
      {image ? (
        <img
          src={image.secureUrl}
          alt={image.altText || product.name || 'Product image'}
          loading="lazy"
          className="size-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div aria-hidden="true" className="size-12 shrink-0 rounded-md bg-page" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-text-primary">
          {product.name || 'Untitled product'}
        </p>
        <p className="mt-1 text-supporting text-text-secondary">
          Updated {formatDate(product.updatedAt)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusLabel tone={moderationTones[product.moderationStatus]}>
          {moderationLabels[product.moderationStatus]}
        </StatusLabel>
        <StatusLabel tone={publicationTones[product.publicationStatus]}>
          {publicationLabels[product.publicationStatus]}
        </StatusLabel>
      </div>
    </li>
  )
}

interface OverviewMetricProps {
  label: string
  count: number | undefined
  isPending: boolean
  isError: boolean
  to: string
}

function OverviewMetric({ label, count, isPending, isError, to }: OverviewMetricProps) {
  const value = isError ? 'Unavailable' : isPending ? 'Loading' : (count ?? 0)

  return (
    <Link
      to={to}
      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <p className="text-supporting text-text-secondary">{label}</p>
      <p aria-live="polite" className="mt-2 text-section-heading font-bold text-text-primary">
        {value}
      </p>
    </Link>
  )
}

/** Gives the seller a snapshot of their products and promotions. */
export default function SellerDashboardPage() {
  const productsQuery = useSellerProducts({
    page: 1,
    limit: PRODUCT_PREVIEW_LIMIT,
  })

  const promotionsQuery = useSellerPromotions({
    page: 1,
    limit: PROMOTION_PREVIEW_LIMIT,
  })

  const draftProductsQuery = useSellerProducts({
    page: 1,
    limit: 1,
    publicationStatus: 'draft',
  })

  const pendingProductsQuery = useSellerProducts({
    page: 1,
    limit: 1,
    moderationStatus: 'pending',
  })

  const publishedProductsQuery = useSellerProducts({
    page: 1,
    limit: 1,
    publicationStatus: 'published',
  })

  const archivedProductsQuery = useSellerProducts({
    page: 1,
    limit: 1,
    publicationStatus: 'archived',
  })

  const activePromotionsQuery = useSellerPromotions({
    page: 1,
    limit: 1,
    status: 'active',
  })

  const scheduledPromotionsQuery = useSellerPromotions({
    page: 1,
    limit: 1,
    status: 'scheduled',
  })

  const products = productsQuery.data?.products ?? []
  const promotions = promotionsQuery.data?.promotions ?? []

  return (
    <div className="space-y-6">
      <PageHeading
        title="Seller overview"
        description="A snapshot of your products and promotions."
        action={
          <Link
            to="/seller/products/new"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Add Product
          </Link>
        }
      />

      <section aria-label="Workspace totals" className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/seller/products"
          className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <p className="text-supporting text-text-secondary">Total products</p>
          <p className="mt-2 text-section-heading font-bold text-text-primary">
            {productsQuery.isError
              ? 'Unavailable'
              : productsQuery.isPending
                ? 'Loading'
                : (productsQuery.data?.pagination.totalItems ?? 0)}
          </p>
          <p className="mt-1 text-supporting text-primary">View products</p>
        </Link>

        <Link
          to="/seller/promotions"
          className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <p className="text-supporting text-text-secondary">Total promotions</p>
          <p className="mt-2 text-section-heading font-bold text-text-primary">
            {promotionsQuery.isError
              ? 'Unavailable'
              : promotionsQuery.isPending
                ? 'Loading'
                : (promotionsQuery.data?.pagination.totalItems ?? 0)}
          </p>
          <p className="mt-1 text-supporting text-primary">View promotions</p>
        </Link>
      </section>

      <section aria-label="Status counts" className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-card-heading font-semibold text-text-primary">Product status</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewMetric
              label="Draft"
              count={draftProductsQuery.data?.pagination.totalItems}
              isPending={draftProductsQuery.isPending}
              isError={draftProductsQuery.isError}
              to="/seller/products?publicationStatus=draft"
            />
            <OverviewMetric
              label="Pending review"
              count={pendingProductsQuery.data?.pagination.totalItems}
              isPending={pendingProductsQuery.isPending}
              isError={pendingProductsQuery.isError}
              to="/seller/products?moderationStatus=pending"
            />
            <OverviewMetric
              label="Published"
              count={publishedProductsQuery.data?.pagination.totalItems}
              isPending={publishedProductsQuery.isPending}
              isError={publishedProductsQuery.isError}
              to="/seller/products?publicationStatus=published"
            />
            <OverviewMetric
              label="Archived"
              count={archivedProductsQuery.data?.pagination.totalItems}
              isPending={archivedProductsQuery.isPending}
              isError={archivedProductsQuery.isError}
              to="/seller/products?publicationStatus=archived"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-card-heading font-semibold text-text-primary">Promotion status</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewMetric
              label="Active"
              count={activePromotionsQuery.data?.pagination.totalItems}
              isPending={activePromotionsQuery.isPending}
              isError={activePromotionsQuery.isError}
              to="/seller/promotions?status=active"
            />
            <OverviewMetric
              label="Scheduled"
              count={scheduledPromotionsQuery.data?.pagination.totalItems}
              isPending={scheduledPromotionsQuery.isPending}
              isError={scheduledPromotionsQuery.isError}
              to="/seller/promotions?status=scheduled"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-card-heading font-semibold text-text-primary">Recent products</h2>
              <p className="mt-1 text-supporting text-text-secondary">
                Your latest product drafts and listings.
              </p>
            </div>
            <Link to="/seller/products" className={linkClasses}>
              View all
            </Link>
          </div>

          {productsQuery.isPending ? (
            <LoadingState label="Loading products..." />
          ) : productsQuery.isError ? (
            <ErrorState
              title="Products could not be loaded"
              description={getApiError(productsQuery.error).message}
              onRetry={() => void productsQuery.refetch()}
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products yet"
              description="Create your first product to start building your catalogue."
              action={
                <Link
                  to="/seller/products/new"
                  className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Add your first product
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <ProductPreview key={product._id} product={product} />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-card-heading font-semibold text-text-primary">
                Recent promotions
              </h2>
              <p className="mt-1 text-supporting text-text-secondary">
                Your latest promotion activity.
              </p>
            </div>
            <Link to="/seller/promotions" className={linkClasses}>
              View all
            </Link>
          </div>

          {promotionsQuery.isPending ? (
            <LoadingState label="Loading promotions..." />
          ) : promotionsQuery.isError ? (
            <ErrorState
              title="Promotions could not be loaded"
              description={getApiError(promotionsQuery.error).message}
              onRetry={() => void promotionsQuery.refetch()}
            />
          ) : promotions.length === 0 ? (
            <EmptyState
              title="No promotions yet"
              description="Your promotions will appear here after you create them."
              action={
                <Link
                  to="/seller/promotions/new"
                  className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Create a promotion
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {promotions.map((promotion) => (
                <li
                  key={promotion._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/seller/promotions/${encodeURIComponent(promotion._id)}`}
                      className="truncate font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {promotion.name}
                    </Link>
                    <p className="mt-1 text-supporting text-text-secondary">
                      {promotion.discountType === 'percentage'
                        ? `${promotion.discountValue}% off`
                        : `${promotion.discountValue} fixed amount`}
                      {' · Ends '}
                      {formatDate(promotion.endsAt)}
                    </p>
                  </div>

                  <StatusLabel tone={promotionTones[promotion.status]}>
                    {promotionLabels[promotion.status]}
                  </StatusLabel>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
