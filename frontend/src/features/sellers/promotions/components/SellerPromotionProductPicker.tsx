import { useState } from 'react'

import { EmptyState } from '../../../../components/feedback/EmptyState'
import { ErrorState } from '../../../../components/feedback/ErrorState'
import { LoadingState } from '../../../../components/feedback/LoadingState'
import { Pagination } from '../../../../components/ui/Pagination'
import { useSellerProducts } from '../../products/hooks/useSellerProducts'
import { getApiError } from '../../../../lib/apiError'

const PAGE_SIZE = 10

interface SellerPromotionProductPickerProps {
  selectedProductIds: string[]
  onChange: (productIds: string[]) => void
}

/** Lets sellers select approved, published products across paginated results. */
export function SellerPromotionProductPicker({
  selectedProductIds,
  onChange,
}: SellerPromotionProductPickerProps) {
  const [page, setPage] = useState(1)

  const productsQuery = useSellerProducts({
    page,
    limit: PAGE_SIZE,
    moderationStatus: 'approved',
    publicationStatus: 'published',
  })

  const products = productsQuery.data?.products ?? []
  const pagination = productsQuery.data?.pagination

  function updateSelection(productId: string, isSelected: boolean) {
    if (isSelected) {
      if (!selectedProductIds.includes(productId)) {
        onChange([...selectedProductIds, productId])
      }
      return
    }

    onChange(selectedProductIds.filter((selectedId) => selectedId !== productId))
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-card-heading font-semibold text-text-primary">Eligible products</h2>
        <p className="mt-1 text-supporting text-text-secondary">
          Select at least one approved, published product. Your selection is kept when you move
          between pages.
        </p>
        <p className="mt-2 text-supporting font-medium text-text-primary" aria-live="polite">
          {selectedProductIds.length} selected
        </p>
      </div>

      {productsQuery.isLoading ? (
        <LoadingState label="Loading eligible products…" />
      ) : productsQuery.isError && !productsQuery.data ? (
        <ErrorState
          title="Eligible products could not be loaded"
          description={getApiError(productsQuery.error).message}
          onRetry={() => void productsQuery.refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="No eligible products found"
          description="Products must be approved and published before they can be selected for a promotion."
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const image =
                product.images.find((productImage) => productImage.isPrimary) ?? product.images[0]
              const checked = selectedProductIds.includes(product._id)

              return (
                <li key={product._id}>
                  <label
                    className={[
                      'flex h-full cursor-pointer items-center gap-3 rounded-xl border bg-surface p-4',
                      'focus-within:ring-2 focus-within:ring-primary',
                      checked ? 'border-primary' : 'border-border',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={checked}
                      onChange={(event) => updateSelection(product._id, event.target.checked)}
                    />

                    {image ? (
                      <img
                        src={image.secureUrl}
                        alt={image.altText || product.name || 'Product image'}
                        loading="lazy"
                        className="size-14 shrink-0 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="size-14 shrink-0 rounded-md border border-border bg-page"
                      />
                    )}

                    <span className="min-w-0">
                      <span className="block truncate text-body font-medium text-text-primary">
                        {product.name || 'Untitled product'}
                      </span>
                      <span className="mt-1 block text-supporting text-text-secondary">
                        Approved · Published
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

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
    </section>
  )
}
