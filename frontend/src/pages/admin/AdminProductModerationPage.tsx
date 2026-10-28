import { useNavigate, useSearchParams } from 'react-router'
import { FiRefreshCw } from 'react-icons/fi'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel'
import { ModerationProductList } from '../../features/admin/products/components/ModerationProductList'
import { useAdminProducts } from '../../features/admin/products/hooks/useAdminProductModeration'
import type { AdminProductReviewStatus } from '../../features/admin/products/types'
import { getApiError } from '../../lib/apiError'

const pageSize = 20

const queueStatuses: {
  value: AdminProductReviewStatus
  label: string
}[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

// const metricStatuses: {
//   value: AdminProductReviewStatus
//   label: string
//   tone: StatusTone
// }[] = [
//   { value: 'pending', label: 'Pending review', tone: 'warning' },
//   { value: 'changes_requested', label: 'Changes requested', tone: 'information' },
//   { value: 'approved', label: 'Approved', tone: 'success' },
// ]

function getQueueStatus(value: string | null): AdminProductReviewStatus {
  return queueStatuses.find((status) => status.value === value)?.value ?? 'pending'
}

function getPage(value: string | null): number {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}

function MetricCard({
  label,
  tone,
  count,
  isLoading,
  isError,
}: {
  label: string
  tone: StatusTone
  count: number | undefined
  isLoading: boolean
  isError: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <StatusLabel tone={tone}>{label}</StatusLabel>
      <p className="mt-3 text-2xl font-semibold text-text-primary" aria-live="polite">
        {isLoading ? '…' : isError || count === undefined ? 'Unavailable' : count.toLocaleString()}
      </p>
    </div>
  )
}

/** Lets administrators browse and filter submitted products for moderation. */
export default function AdminProductModerationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const moderationStatus = getQueueStatus(searchParams.get('moderationStatus'))
  const page = getPage(searchParams.get('page'))

  const productsQuery = useAdminProducts({
    page,
    limit: pageSize,
    moderationStatus,
  })

  // The backend returns a totalItems count for each status-filtered list.
  // Request one row per status so the dashboard counts remain server-derived.
  const pendingCountQuery = useAdminProducts({
    page: 1,
    limit: 1,
    moderationStatus: 'pending',
  })
  const changesRequestedCountQuery = useAdminProducts({
    page: 1,
    limit: 1,
    moderationStatus: 'changes_requested',
  })
  const approvedCountQuery = useAdminProducts({
    page: 1,
    limit: 1,
    moderationStatus: 'approved',
  })

  const handleStatusChange = (status: AdminProductReviewStatus) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('moderationStatus', status)
    nextSearchParams.delete('page')
    setSearchParams(nextSearchParams)
  }

  const handlePageChange = (nextPage: number) => {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (nextPage === 1) {
      nextSearchParams.delete('page')
    } else {
      nextSearchParams.set('page', String(nextPage))
    }

    setSearchParams(nextSearchParams)
  }

  const handleReview = (productId: string) => {
    const queueContext = searchParams.toString()
    const search = queueContext ? `?${queueContext}` : ''

    navigate(`/admin/products/${encodeURIComponent(productId)}${search}`)
  }

  const handleRefresh = async () => {
    await Promise.all([
      productsQuery.refetch(),
      pendingCountQuery.refetch(),
      changesRequestedCountQuery.refetch(),
      approvedCountQuery.refetch(),
    ])
  }

  const isRefreshing = productsQuery.isFetching && !productsQuery.isPending
  const products = productsQuery.data?.products ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Product Moderation"
          description="Review seller product listings and record moderation decisions."
        />

        <Button
          type="button"
          variant="outline"
          disabled={isRefreshing}
          onClick={() => void handleRefresh()}
          aria-label="Refresh product moderation queue"
        >
          <FiRefreshCw aria-hidden="true" className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <section aria-label="Moderation summary" className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Pending review"
          tone="warning"
          count={pendingCountQuery.data?.pagination.totalItems}
          isLoading={pendingCountQuery.isPending}
          isError={pendingCountQuery.isError}
        />
        <MetricCard
          label="Changes requested"
          tone="information"
          count={changesRequestedCountQuery.data?.pagination.totalItems}
          isLoading={changesRequestedCountQuery.isPending}
          isError={changesRequestedCountQuery.isError}
        />
        <MetricCard
          label="Approved"
          tone="success"
          count={approvedCountQuery.data?.pagination.totalItems}
          isLoading={approvedCountQuery.isPending}
          isError={approvedCountQuery.isError}
        />
      </section>

      <nav aria-label="Filter products by moderation status" className="flex flex-wrap gap-2">
        {queueStatuses.map((status) => (
          <button
            key={status.value}
            type="button"
            aria-pressed={moderationStatus === status.value}
            onClick={() => handleStatusChange(status.value)}
            className={[
              'min-h-11 rounded-md border px-4 py-2 text-supporting font-medium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              moderationStatus === status.value
                ? 'border-primary bg-secondary text-primary'
                : 'border-border bg-surface text-text-secondary hover:bg-page',
            ].join(' ')}
          >
            {status.label}
          </button>
        ))}
      </nav>

      {productsQuery.isPending ? (
        <LoadingState label={`Loading ${moderationStatus.replace('_', ' ')} products…`} />
      ) : productsQuery.isError ? (
        <ErrorState
          description={getApiError(productsQuery.error).message}
          onRetry={() => void productsQuery.refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title={`No ${moderationStatus.replace('_', ' ')} products`}
          description="Products with this moderation status will appear here."
        />
      ) : (
        <>
          <ModerationProductList products={products} onReview={handleReview} />
          <Pagination
            currentPage={page}
            pageSize={productsQuery.data.pagination.limit}
            totalItems={productsQuery.data.pagination.totalItems}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}
