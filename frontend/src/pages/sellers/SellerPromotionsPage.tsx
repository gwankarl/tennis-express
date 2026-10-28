import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { Pagination } from '../../components/ui/Pagination'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel'
import { getApiError } from '../../lib/apiError'
import { useSellerPromotions } from '../../features/sellers/promotions/hooks/useSellerPromotions'
import {
  sellerPromotionStatuses,
  type SellerPromotionStatus,
} from '../../features/sellers/promotions/types'

const PAGE_SIZE = 20

const selectClasses =
  'min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto'

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

/** Lists the authenticated seller's promotions with status filtering and pagination. */
export default function SellerPromotionsPage() {
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const status: SellerPromotionStatus | '' = sellerPromotionStatuses.some(
    (value) => value === statusParam,
  )
    ? (statusParam as SellerPromotionStatus)
    : ''

  const promotionsQuery = useSellerPromotions({
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
  })

  const promotions = promotionsQuery.data?.promotions ?? []
  const pagination = promotionsQuery.data?.pagination

  return (
    <div className="space-y-6">
      <PageHeading
        title="Promotions"
        description="Review your promotions and their current schedules."
        action={
          <Link
            to="/seller/promotions/new"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Add promotion
          </Link>
        }
      />

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-form-label font-medium text-text-secondary">
          Status
          <select
            className={selectClasses}
            value={status}
            onChange={(event) => {
              const nextSearchParams = new URLSearchParams(searchParams)
              const nextStatus = event.target.value as SellerPromotionStatus | ''

              if (nextStatus) {
                nextSearchParams.set('status', nextStatus)
              } else {
                nextSearchParams.delete('status')
              }

              setSearchParams(nextSearchParams)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            {sellerPromotionStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </section>

      {promotionsQuery.isLoading ? (
        <LoadingState label="Loading promotions..." />
      ) : promotionsQuery.isError && !promotionsQuery.data ? (
        <ErrorState
          title="Promotions could not be loaded"
          description={getApiError(promotionsQuery.error).message}
          onRetry={() => void promotionsQuery.refetch()}
        />
      ) : promotions.length === 0 ? (
        <EmptyState
          title={
            status ? `No ${statusLabels[status].toLowerCase()} promotions` : 'No promotions yet'
          }
          description={
            status ? 'Try selecting another status.' : 'Promotions you create will appear here.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-190 border-collapse text-left">
              <thead className="border-b border-border bg-page">
                <tr className="text-form-label text-text-secondary">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Promotion
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Discount
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Eligible products
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Schedule
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {promotions.map((promotion) => (
                  <tr key={promotion._id} className="align-top">
                    <th scope="row" className="px-4 py-4 text-body font-semibold text-text-primary">
                      <Link
                        to={`/seller/promotions/${encodeURIComponent(promotion._id)}`}
                        className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {promotion.name}
                      </Link>
                    </th>
                    <td className="px-4 py-4 text-body text-text-primary">
                      {promotion.discountType === 'percentage'
                        ? `${promotion.discountValue}%`
                        : promotion.discountValue}
                      <span className="ml-1 text-supporting text-text-secondary">
                        {promotion.discountType === 'percentage' ? 'off' : 'fixed amount'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-body text-text-primary">
                      {promotion.eligibleProductIds.length}
                    </td>
                    <td className="px-4 py-4 text-supporting text-text-secondary">
                      <div>Starts {formatDateTime(promotion.startsAt)}</div>
                      <div className="mt-1">Ends {formatDateTime(promotion.endsAt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusLabel tone={statusTones[promotion.status]}>
                        {statusLabels[promotion.status]}
                      </StatusLabel>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <Pagination
              currentPage={pagination.page}
              pageSize={pagination.limit}
              totalItems={pagination.totalItems}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
