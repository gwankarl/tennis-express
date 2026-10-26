import { useState } from 'react'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { Label } from '../../components/ui/Label'
import { Pagination } from '../../components/ui/Pagination'
import { BrandForm } from '../../features/admin/brands/components/BrandForm'
import { BrandList } from '../../features/admin/brands/components/BrandList'
import { Dialog } from '../../components/ui/Dialog'
import {
  useAdminBrand,
  useAdminBrands,
  useCreateAdminBrand,
  useUpdateAdminBrand,
  useUpdateAdminBrandStatus,
} from '../../features/admin/brands/hooks/useAdminBrands'
import type { Brand, BrandStatus, CreateBrandRequest } from '../../features/admin/brands/types'
import { getApiError } from '../../lib/apiError'

const pageSize = 20
type StatusFilter = BrandStatus | 'all'

/** Lets administrators browse, create, and edit brands. */
export default function AdminBrandsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null)
  const [statusBrand, setStatusBrand] = useState<Brand | null>(null)
  const [notice, setNotice] = useState<{
    title: string
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  const query = {
    page,
    limit: pageSize,
    ...(statusFilter === 'all' ? {} : { status: statusFilter }),
  }

  const brandsQuery = useAdminBrands(query)
  const brandDetailQuery = useAdminBrand(editingBrandId)
  const createMutation = useCreateAdminBrand()
  const updateMutation = useUpdateAdminBrand()
  const statusMutation = useUpdateAdminBrandStatus()
  const isSaving = createMutation.isPending || updateMutation.isPending

  const brands = brandsQuery.data?.brands ?? []
  const normalizedSearch = search.trim().toLowerCase()
  const visibleBrands = brands.filter((brand) => {
    return (
      brand.name.toLowerCase().includes(normalizedSearch) ||
      brand.slug.toLowerCase().includes(normalizedSearch)
    )
  })

  const isFormOpen = isCreating || editingBrandId !== null

  const closeForm = () => {
    setIsCreating(false)
    setEditingBrandId(null)
  }

  const openCreateForm = () => {
    setEditingBrandId(null)
    setIsCreating(true)
    setNotice(null)
  }

  const openEditForm = (brand: Brand) => {
    setIsCreating(false)
    setEditingBrandId(brand._id)
    setNotice(null)
  }

  const handleSave = async (fields: CreateBrandRequest, logo?: File) => {
    if (editingBrandId) {
      await updateMutation.mutateAsync({
        brandId: editingBrandId,
        fields,
        logo,
      })

      setNotice({
        title: 'Brand updated',
        message: 'The brand changes have been saved.',
        tone: 'success',
      })
    } else {
      await createMutation.mutateAsync({ fields, logo })
      setPage(1)

      setNotice({
        title: 'Brand added',
        message: 'The brand has been created.',
        tone: 'success',
      })
    }

    closeForm()
  }

  const handleConfirmStatusChange = async () => {
    if (!statusBrand) return

    const brand = statusBrand
    const nextStatus: BrandStatus = brand.status === 'active' ? 'inactive' : 'active'

    try {
      await statusMutation.mutateAsync({
        brandId: brand._id,
        status: nextStatus,
      })

      setNotice({
        title: 'Brand status updated',
        message: `${brand.name} is now ${nextStatus}.`,
        tone: 'success',
      })
      setStatusBrand(null)
    } catch (error) {
      setNotice({
        title: 'Brand status could not be changed',
        message: getApiError(error).message,
        tone: 'error',
      })
      setStatusBrand(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Brands"
        description="Manage the brands available in the product catalog."
        action={
          !isFormOpen ? (
            <Button type="button" onClick={openCreateForm}>
              Add brand
            </Button>
          ) : undefined
        }
      />

      {notice && (
        <Notification
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
          onDismiss={() => setNotice(null)}
        />
      )}

      {isFormOpen && (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          {isCreating ? (
            <BrandForm
              key="new-brand"
              brand={null}
              isSaving={isSaving}
              onCancel={closeForm}
              onSave={handleSave}
            />
          ) : brandDetailQuery.isPending ? (
            <LoadingState label="Loading brand details…" />
          ) : brandDetailQuery.isError ? (
            <ErrorState
              description={getApiError(brandDetailQuery.error).message}
              onRetry={() => void brandDetailQuery.refetch()}
            />
          ) : brandDetailQuery.data ? (
            <BrandForm
              key={brandDetailQuery.data._id}
              brand={brandDetailQuery.data}
              isSaving={isSaving}
              onCancel={closeForm}
              onSave={handleSave}
            />
          ) : null}
        </section>
      )}

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(14rem,1fr)_12rem] sm:items-end">
        <FormField
          id="brand-search"
          label="Search this page"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or slug"
        />

        <div className="grid gap-1.5">
          <Label htmlFor="brand-status-filter">Status</Label>
          <select
            id="brand-status-filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter)
              setPage(1)
            }}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <p className="text-supporting text-text-secondary sm:col-span-2">
          Search filters the brands on the current page. Status filtering is applied by the server.
        </p>
      </section>

      {brandsQuery.isPending ? (
        <LoadingState label="Loading brands…" />
      ) : brandsQuery.isError ? (
        <ErrorState
          description={getApiError(brandsQuery.error).message}
          onRetry={() => void brandsQuery.refetch()}
        />
      ) : visibleBrands.length === 0 ? (
        <EmptyState
          title={brands.length === 0 ? 'No brands found' : 'No matching brands'}
          description={
            brands.length === 0
              ? 'Add a brand to begin managing the product catalog.'
              : 'Try another name or slug, or change the status filter.'
          }
          action={
            brands.length === 0 && !isFormOpen ? (
              <Button type="button" onClick={openCreateForm}>
                Add brand
              </Button>
            ) : undefined
          }
        />
      ) : (
        <BrandList brands={visibleBrands} onEdit={openEditForm} onChangeStatus={setStatusBrand} />
      )}

      {brandsQuery.data && (
        <Pagination
          currentPage={page}
          pageSize={brandsQuery.data.pagination.limit}
          totalItems={brandsQuery.data.pagination.totalItems}
          onPageChange={setPage}
        />
      )}

      <Dialog
        open={statusBrand !== null}
        onOpenChange={(open) => {
          if (!open && !statusMutation.isPending) {
            setStatusBrand(null)
          }
        }}
        title={statusBrand?.status === 'active' ? 'Deactivate brand?' : 'Activate brand?'}
        description={
          statusBrand
            ? `This will change ${statusBrand.name} from ${statusBrand.status} to ${
                statusBrand.status === 'active' ? 'inactive' : 'active'
              }.`
            : undefined
        }
      >
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={statusMutation.isPending}
            onClick={() => setStatusBrand(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={statusBrand?.status === 'active' ? 'danger' : 'primary'}
            disabled={statusMutation.isPending}
            onClick={() => void handleConfirmStatusChange()}
          >
            {statusMutation.isPending
              ? 'Saving…'
              : statusBrand?.status === 'active'
                ? 'Deactivate brand'
                : 'Activate brand'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
