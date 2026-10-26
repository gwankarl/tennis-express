import { useState } from 'react'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { Label } from '../../components/ui/Label'
import { Pagination } from '../../components/ui/Pagination'
import { AdminStoreList } from '../../features/admin/stores/components/AdminStoreList'
import { useAdminStores } from '../../features/admin/stores/hooks/useAdminStores'
import type { AdminStoreStatus } from '../../features/admin/stores/types'
import { getApiError } from '../../lib/apiError'

const pageSize = 20
type StatusFilter = AdminStoreStatus | 'all'

/** Lets administrators browse stores and filter by status. */
export default function AdminStoresPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const query = {
    page,
    limit: pageSize,
    ...(statusFilter === 'all' ? {} : { status: statusFilter }),
  }

  const storesQuery = useAdminStores(query)
  const stores = storesQuery.data?.stores ?? []

  return (
    <div className="space-y-6">
      <PageHeading
        title="Store Management"
        description="Review seller storefronts, their locations, and their current availability."
      />

      <div className="grid max-w-xs gap-1.5">
        <Label htmlFor="store-status-filter">Filter by status</Label>
        <select
          id="store-status-filter"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as StatusFilter)
            setPage(1)
          }}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">All stores</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {storesQuery.isPending ? (
        <LoadingState label="Loading stores…" />
      ) : storesQuery.isError ? (
        <ErrorState
          description={getApiError(storesQuery.error).message}
          onRetry={() => void storesQuery.refetch()}
        />
      ) : stores.length === 0 ? (
        <EmptyState
          title="No stores found"
          description={
            statusFilter === 'all'
              ? 'There are no stores to display yet.'
              : `There are no ${statusFilter} stores.`
          }
        />
      ) : (
        <AdminStoreList stores={stores} />
      )}

      {storesQuery.data && (
        <Pagination
          currentPage={page}
          pageSize={storesQuery.data.pagination.limit}
          totalItems={storesQuery.data.pagination.totalItems}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
