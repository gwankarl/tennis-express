import { Link, useSearchParams } from 'react-router'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Pagination } from '../../components/ui/Pagination'
import { usePublicProductSearch } from '../../features/products/hooks/usePublicProducts'
import { getApiError } from '../../lib/apiError'

const pageSize = 12

const xafFormatter = new Intl.NumberFormat('fr-CM', {
  style: 'currency',
  currency: 'XAF',
  maximumFractionDigits: 0,
})

/** Shows a minimal, paginated product search result list. */
export default function PublicProductSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const parsedPage = Number(searchParams.get('page') ?? '1')
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const categoryId = searchParams.get('categoryId')?.trim() ?? ''

  const searchQuery = usePublicProductSearch({
    q: query || undefined,
    categoryId: categoryId || undefined,
    page,
    limit: pageSize,
  })

  const changePage = (nextPage: number) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set('page', String(nextPage))
      return nextParams
    })
  }

  if (!query && !categoryId) {
    return (
      <EmptyState
        title="Search for tennis products"
        description="Enter a product name or choose a category to see matching products."
      />
    )
  }

  if (searchQuery.isPending) {
    return <LoadingState label="Searching products…" />
  }

  if (searchQuery.isError) {
    const apiError = getApiError(searchQuery.error)

    return <ErrorState description={apiError.message} onRetry={() => void searchQuery.refetch()} />
  }

  const { products, pagination } = searchQuery.data

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page-title font-bold text-text-primary">
          {query ? 'Search results' : 'Category products'}
        </h1>
        <p className="mt-2 text-supporting text-text-secondary">
          {query ? `Results for “${query}”` : 'Browse products in this category.'}
        </p>
      </header>

      {products.length === 0 ? (
        <EmptyState title="No matching products" description="Try a different product name." />
      ) : (
        <>
          <section
            aria-label="Product search results"
            className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
          >
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                {product.primaryImage ? (
                  <img
                    src={product.primaryImage.secureUrl}
                    alt={product.primaryImage.altText}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-page p-4 text-center text-supporting text-text-secondary">
                    No image available
                  </div>
                )}

                <div className="space-y-2 p-3 sm:p-4">
                  <h2 className="line-clamp-2 font-semibold text-text-primary">{product.name}</h2>

                  <p className="text-supporting text-text-secondary">
                    {product.price.min === product.price.max
                      ? xafFormatter.format(product.price.min)
                      : `${xafFormatter.format(product.price.min)} – ${xafFormatter.format(product.price.max)}`}
                  </p>

                  <p className="text-supporting text-text-secondary">
                    {product.availability === 'in_stock' ? 'In stock' : 'Out of stock'}
                  </p>

                  <Link
                    to={`/stores/${encodeURIComponent(product.store.slug)}`}
                    className="inline-flex min-h-10 items-center text-supporting font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Visit {product.store.name}
                  </Link>
                </div>
              </article>
            ))}
          </section>

          <Pagination
            currentPage={pagination.page}
            pageSize={pagination.limit}
            totalItems={pagination.totalItems}
            onPageChange={changePage}
          />
        </>
      )}
    </div>
  )
}
