import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { Label } from '../../components/ui/Label'
import { Pagination } from '../../components/ui/Pagination'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel'
import { AdminPromotionList } from '../../features/admin/promotions/components/AdminPromotionList'
import { useAdminPromotions } from '../../features/admin/promotions/hooks/useAdminPromotions'
import type {
  AdminPromotionStatus,
  AdminPromotionType,
} from '../../features/admin/promotions/types'
import { getApiError } from '../../lib/apiError'

const pageSize = 20

type StatusFilter = AdminPromotionStatus | 'all'
type TypeFilter = AdminPromotionType | 'all'

function getEmptyDescription(status: StatusFilter, type: TypeFilter, search: string): string {
  if (search) return 'Try another promotion name or clear the search.'
  if (status !== 'all') return `There are no ${status} promotions.`
  if (type !== 'all') return `There are no ${type.replace('_', ' ')} promotions.`

  return 'Promotions will appear here when they have been created.'
}

function PromotionSummaryCard({
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

/** Lists and filters promotions for administrative oversight. */
export default function AdminPromotionsPage() {
  const [page, setPage] = useState(1)
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [type, setType] = useState<TypeFilter>('all')

  const promotionsQuery = useAdminPromotions({
    page,
    limit: pageSize,
    ...(search ? { search } : {}),
    ...(status === 'all' ? {} : { status }),
    ...(type === 'all' ? {} : { type }),
  })

  const draftCountQuery = useAdminPromotions({ page: 1, limit: 1, status: 'draft' })
  const scheduledCountQuery = useAdminPromotions({ page: 1, limit: 1, status: 'scheduled' })
  const activeCountQuery = useAdminPromotions({ page: 1, limit: 1, status: 'active' })
  const endedCountQuery = useAdminPromotions({ page: 1, limit: 1, status: 'ended' })
  const cancelledCountQuery = useAdminPromotions({ page: 1, limit: 1, status: 'cancelled' })

  const promotions = promotionsQuery.data?.promotions ?? []

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearch(draftSearch.trim())
    setPage(1)
  }

  function clearSearch() {
    setDraftSearch('')
    setSearch('')
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatus(value as StatusFilter)
    setPage(1)
  }

  function handleTypeChange(value: string) {
    setType(value as TypeFilter)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Promotions"
        description="Review seller discounts and marketplace campaigns."
        action={
          <Link
            to="/admin/promotions/new"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Create campaign
          </Link>
        }
      />

      <section
        aria-label="Promotion counts by status"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <PromotionSummaryCard
          label="Draft"
          tone="neutral"
          count={draftCountQuery.data?.pagination.totalItems}
          isLoading={draftCountQuery.isPending}
          isError={draftCountQuery.isError}
        />
        <PromotionSummaryCard
          label="Scheduled"
          tone="information"
          count={scheduledCountQuery.data?.pagination.totalItems}
          isLoading={scheduledCountQuery.isPending}
          isError={scheduledCountQuery.isError}
        />
        <PromotionSummaryCard
          label="Active"
          tone="success"
          count={activeCountQuery.data?.pagination.totalItems}
          isLoading={activeCountQuery.isPending}
          isError={activeCountQuery.isError}
        />
        <PromotionSummaryCard
          label="Ended"
          tone="neutral"
          count={endedCountQuery.data?.pagination.totalItems}
          isLoading={endedCountQuery.isPending}
          isError={endedCountQuery.isError}
        />
        <PromotionSummaryCard
          label="Cancelled"
          tone="error"
          count={cancelledCountQuery.data?.pagination.totalItems}
          isLoading={cancelledCountQuery.isPending}
          isError={cancelledCountQuery.isError}
        />
      </section>

      <section
        aria-label="Promotion filters"
        className="grid gap-4 rounded-xl border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-[minmax(16rem,2fr)_1fr_1fr_auto]"
      >
        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor="promotion-search">Search by promotion name</Label>
            <input
              id="promotion-search"
              type="search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              maxLength={100}
              className="mt-1 w-full rounded-md border border-border bg-page px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Search promotions"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div>
          <Label htmlFor="promotion-status-filter">Status</Label>
          <select
            id="promotion-status-filter"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-page px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <Label htmlFor="promotion-type-filter">Type</Label>
          <select
            id="promotion-type-filter"
            value={type}
            onChange={(event) => handleTypeChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-page px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All types</option>
            <option value="seller_discount">Seller discount</option>
            <option value="marketplace_campaign">Marketplace campaign</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            disabled={!search && !draftSearch && status === 'all' && type === 'all'}
            onClick={() => {
              clearSearch()
              setStatus('all')
              setType('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      </section>

      {promotionsQuery.isPending ? (
        <LoadingState label="Loading promotions…" />
      ) : promotionsQuery.isError ? (
        <ErrorState
          description={getApiError(promotionsQuery.error).message}
          onRetry={() => void promotionsQuery.refetch()}
        />
      ) : promotions.length === 0 ? (
        <EmptyState
          title="No promotions found"
          description={getEmptyDescription(status, type, search)}
        />
      ) : (
        <>
          <AdminPromotionList promotions={promotions} />
          <Pagination
            currentPage={page}
            pageSize={promotionsQuery.data.pagination.limit}
            totalItems={promotionsQuery.data.pagination.totalItems}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
