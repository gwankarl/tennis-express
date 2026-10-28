import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog'
import { Pagination } from '../../components/ui/Pagination'
import { getApiError } from '../../lib/apiError'
import {
  useArchiveSellerProduct,
  useDeleteSellerProduct,
  usePublishSellerProduct,
  useRestoreSellerProduct,
  useSellerProducts,
} from '../../features/sellers/products/hooks/useSellerProducts'
import { SellerProductList } from '../../features/sellers/products/components/SellerProductList'
import {
  productConditions,
  productModerationStatuses,
  productPublicationStatuses,
} from '../../features/sellers/products/types'
import type {
  ListSellerProductsParams,
  ProductCondition,
  ProductModerationStatus,
  ProductPublicationStatus,
  SellerProduct,
} from '../../features/sellers/products/types'

type ProductAction =
  | { type: 'archive'; product: SellerProduct }
  | { type: 'restore'; product: SellerProduct }
  | { type: 'publish'; product: SellerProduct }
  | { type: 'delete'; product: SellerProduct }

const PAGE_SIZE = 20

const selectClasses =
  'min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto'

function isProductModerationStatus(value: string | null): value is ProductModerationStatus {
  return value !== null && productModerationStatuses.some((status) => status === value)
}

function isProductPublicationStatus(value: string | null): value is ProductPublicationStatus {
  return value !== null && productPublicationStatuses.some((status) => status === value)
}

/** Lists the seller's products and provides actions allowed by their current status. */
export default function SellerProductsPage() {
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()
  const moderationParam = searchParams.get('moderationStatus')
  const publicationParam = searchParams.get('publicationStatus')
  const moderationStatus = isProductModerationStatus(moderationParam) ? moderationParam : ''
  const publicationStatus = isProductPublicationStatus(publicationParam) ? publicationParam : ''
  const [condition, setCondition] = useState<ProductCondition | ''>('')
  const [selectedAction, setSelectedAction] = useState<ProductAction | null>(null)
  const [feedback, setFeedback] = useState<{
    title: string
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  const navigate = useNavigate()

  const params: ListSellerProductsParams = {
    page,
    limit: PAGE_SIZE,
    ...(moderationStatus ? { moderationStatus } : {}),
    ...(publicationStatus ? { publicationStatus } : {}),
    ...(condition ? { condition } : {}),
  }

  const productsQuery = useSellerProducts(params)
  const archiveMutation = useArchiveSellerProduct()
  const restoreMutation = useRestoreSellerProduct()
  const publishMutation = usePublishSellerProduct()
  const deleteMutation = useDeleteSellerProduct()

  const isMutating =
    archiveMutation.isPending ||
    restoreMutation.isPending ||
    publishMutation.isPending ||
    deleteMutation.isPending

  const pendingProductId = archiveMutation.isPending
    ? (archiveMutation.variables ?? null)
    : restoreMutation.isPending
      ? (restoreMutation.variables ?? null)
      : publishMutation.isPending
        ? (publishMutation.variables ?? null)
        : deleteMutation.isPending
          ? (deleteMutation.variables ?? null)
          : null

  const resetPage = () => setPage(1)

  const updateStatusFilter = (
    key: 'moderationStatus' | 'publicationStatus',
    value: ProductModerationStatus | ProductPublicationStatus | '',
  ) => {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (value) {
      nextSearchParams.set(key, value)
    } else {
      nextSearchParams.delete(key)
    }

    setSearchParams(nextSearchParams)
    resetPage()
  }

  const handleConfirmAction = async () => {
    if (!selectedAction) return

    const productName = selectedAction.product.name || 'The product'

    try {
      switch (selectedAction.type) {
        case 'archive':
          await archiveMutation.mutateAsync(selectedAction.product._id)
          setFeedback({
            title: 'Product archived',
            message: `${productName} is now archived.`,
            tone: 'success',
          })
          break

        case 'restore':
          await restoreMutation.mutateAsync(selectedAction.product._id)
          setFeedback({
            title: 'Product restored',
            message: `${productName} was restored as a published product.`,
            tone: 'success',
          })
          break

        case 'publish':
          await publishMutation.mutateAsync(selectedAction.product._id)
          setFeedback({
            title: 'Product published',
            message: `${productName} is now published.`,
            tone: 'success',
          })
          break

        case 'delete':
          await deleteMutation.mutateAsync(selectedAction.product._id)
          setFeedback({
            title: 'Draft deleted',
            message: `${productName} was permanently deleted.`,
            tone: 'success',
          })
          break
      }
    } catch (error) {
      setFeedback({
        title: 'Product action failed',
        message: getApiError(error).message,
        tone: 'error',
      })
    }
  }

  const openActionDialog = (action: ProductAction) => {
    setFeedback(null)
    setSelectedAction(action)
  }

  if (productsQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="My Products"
          description="Review your product listings and their moderation and publication status."
        />
        <LoadingState label="Loading your products..." />
      </div>
    )
  }

  if (productsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="My Products"
          description="Review your product listings and their moderation and publication status."
        />
        <ErrorState
          description={getApiError(productsQuery.error).message}
          onRetry={() => void productsQuery.refetch()}
        />
      </div>
    )
  }

  const { products, pagination } = productsQuery.data

  const dialogTitle =
    selectedAction?.type === 'archive'
      ? 'Archive this product?'
      : selectedAction?.type === 'restore'
        ? 'Restore this product?'
        : selectedAction?.type === 'publish'
          ? 'Publish this product?'
          : selectedAction?.type === 'delete'
            ? 'Delete this draft permanently?'
            : 'Confirm product action'

  const dialogDescription =
    selectedAction?.type === 'archive'
      ? 'The product will be hidden from the storefront. You can restore it later.'
      : selectedAction?.type === 'restore'
        ? 'The product will return to its published status.'
        : selectedAction?.type === 'publish'
          ? 'This approved product will become visible on the storefront.'
          : selectedAction?.type === 'delete'
            ? 'The unsubmitted draft, its variants, and its stored images will be permanently deleted.'
            : ''

  const confirmLabel =
    selectedAction?.type === 'archive'
      ? 'Archive product'
      : selectedAction?.type === 'restore'
        ? 'Restore product'
        : selectedAction?.type === 'publish'
          ? 'Publish product'
          : selectedAction?.type === 'delete'
            ? 'Delete draft'
            : 'Confirm'

  const isDangerousAction = selectedAction?.type === 'archive' || selectedAction?.type === 'delete'

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Products"
        description="Review your product listings and their moderation and publication status."
        action={
          <Button type="button" onClick={() => navigate('/seller/products/new')}>
            Add Product
          </Button>
        }
      />

      {feedback && (
        <Notification
          title={feedback.title}
          message={feedback.message}
          tone={feedback.tone}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <section
        aria-label="Product filters"
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <label className="flex flex-col gap-1 text-form-label font-medium text-text-secondary">
          Moderation
          <select
            className={selectClasses}
            value={moderationStatus}
            onChange={(event) =>
              updateStatusFilter(
                'moderationStatus',
                event.target.value as ProductModerationStatus | '',
              )
            }
          >
            <option value="">All moderation statuses</option>
            {productModerationStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-form-label font-medium text-text-secondary">
          Publication
          <select
            className={selectClasses}
            value={publicationStatus}
            onChange={(event) =>
              updateStatusFilter(
                'publicationStatus',
                event.target.value as ProductPublicationStatus | '',
              )
            }
          >
            <option value="">All publication statuses</option>
            {productPublicationStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-form-label font-medium text-text-secondary">
          Condition
          <select
            className={selectClasses}
            value={condition}
            onChange={(event) => {
              setCondition(event.target.value as ProductCondition | '')
              resetPage()
            }}
          >
            <option value="">All conditions</option>
            {productConditions.map((value) => (
              <option key={value} value={value}>
                {value === 'new' ? 'New' : 'Used'}
              </option>
            ))}
          </select>
        </label>

        {(moderationStatus || publicationStatus || condition) && (
          <Button
            type="button"
            variant="outline"
            size="small"
            className="self-start sm:self-end"
            onClick={() => {
              const nextSearchParams = new URLSearchParams(searchParams)
              nextSearchParams.delete('moderationStatus')
              nextSearchParams.delete('publicationStatus')
              setSearchParams(nextSearchParams)
              setCondition('')
              resetPage()
            }}
          >
            Clear filters
          </Button>
        )}
      </section>

      {products.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
          <h2 className="text-card-heading font-semibold text-text-primary">No products found</h2>
          <p className="mt-2 text-supporting text-text-secondary">
            {moderationStatus || publicationStatus || condition
              ? 'Try changing or clearing the filters.'
              : 'Your product listings will appear here when you create them.'}
          </p>
        </section>
      ) : (
        <>
          <SellerProductList
            products={products}
            pendingProductId={pendingProductId}
            onArchive={(product) => openActionDialog({ type: 'archive', product })}
            onRestore={(product) => openActionDialog({ type: 'restore', product })}
            onPublish={(product) => openActionDialog({ type: 'publish', product })}
            onDelete={(product) => openActionDialog({ type: 'delete', product })}
          />

          <Pagination
            currentPage={pagination.page}
            pageSize={pagination.limit}
            totalItems={pagination.totalItems}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmationDialog
        open={selectedAction !== null}
        onOpenChange={(open) => {
          if (!open && !isMutating) setSelectedAction(null)
        }}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={confirmLabel}
        tone={isDangerousAction ? 'danger' : 'primary'}
        isConfirming={isMutating}
        onConfirm={() => void handleConfirmAction()}
      />
    </div>
  )
}
