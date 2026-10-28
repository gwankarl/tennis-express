import { useState, type FormEvent } from 'react'

import { EmptyState } from '../../../../components/feedback/EmptyState'
import { ErrorState } from '../../../../components/feedback/ErrorState'
import { LoadingState } from '../../../../components/feedback/LoadingState'
import { Button } from '../../../../components/ui/Button'
import { Label } from '../../../../components/ui/Label'
import { Pagination } from '../../../../components/ui/Pagination'
import { useAdminEligibleProducts } from '../hooks/useAdminPromotions'
import { getApiError } from '../../../../lib/apiError'

const pageSize = 10

interface AdminEligibleProductPickerProps {
  selectedProductIds: string[]
  onChange: (productIds: string[]) => void
}

/** Selects eligible products across paginated administrator results. */
export function AdminEligibleProductPicker({
  selectedProductIds,
  onChange,
}: AdminEligibleProductPickerProps) {
  const [page, setPage] = useState(1)
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')

  const productsQuery = useAdminEligibleProducts({
    page,
    limit: pageSize,
    ...(search ? { search } : {}),
  })

  const products = productsQuery.data?.products ?? []
  const pagination = productsQuery.data?.pagination

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
          Select approved, published products with active variants. Selections remain when you
          search or move between pages.
        </p>
        <p className="mt-2 text-supporting font-medium text-text-primary" aria-live="polite">
          {selectedProductIds.length} selected
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Label htmlFor="admin-eligible-product-search">Search products, sellers, or stores</Label>
          <input
            id="admin-eligible-product-search"
            type="search"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            maxLength={100}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Search eligible products"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!draftSearch && !search}
            onClick={clearSearch}
          >
            Clear
          </Button>
        </div>
      </form>

      {productsQuery.isPending ? (
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
          description={
            search
              ? 'Try a different search, or clear it to see all eligible products.'
              : 'Products must be approved and published, and have an active variant.'
          }
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const checked = selectedProductIds.includes(product.id)

              return (
                <li key={product.id}>
                  <label
                    className={[
                      'flex h-full cursor-pointer items-start gap-3 rounded-xl border bg-surface p-4',
                      'focus-within:ring-2 focus-within:ring-primary',
                      checked ? 'border-primary' : 'border-border',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-5 shrink-0 accent-primary"
                      checked={checked}
                      onChange={(event) => updateSelection(product.id, event.target.checked)}
                    />

                    {product.primaryImage ? (
                      <img
                        src={product.primaryImage.secureUrl}
                        alt={product.primaryImage.altText || product.name || 'Product image'}
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
                      <span className="block wrap-break-word text-body font-medium text-text-primary">
                        {product.name || 'Untitled product'}
                      </span>
                      <span className="mt-1 block text-supporting text-text-secondary">
                        {product.store.name} · {product.seller.userName}
                      </span>
                      <span className="mt-1 block text-supporting text-text-secondary">
                        {product.activeVariants.count} active variant
                        {product.activeVariants.count === 1 ? '' : 's'}
                      </span>
                      <span className="mt-1 block text-supporting text-text-secondary">
                        Price range: {product.activeVariants.minimumPrice}–
                        {product.activeVariants.maximumPrice}
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
