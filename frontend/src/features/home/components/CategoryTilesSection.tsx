import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { getApiError } from '../../../lib/apiError'
import { usePublicCategories } from '../../categories/hooks/usePublicCategories'

/** Shows active top-level categories linked to their product results. */
export default function CategoryTilesSection() {
  const categoriesQuery = usePublicCategories()

  if (categoriesQuery.isPending) {
    return <LoadingState label="Loading categories…" />
  }

  if (categoriesQuery.isError) {
    const apiError = getApiError(categoriesQuery.error)

    return (
      <ErrorState
        title="Categories are unavailable"
        description={apiError.message}
        onRetry={() => void categoriesQuery.refetch()}
      />
    )
  }

  const categories = categoriesQuery.data
    .filter((category) => category.parentId === null)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .slice(0, 6)

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No categories available"
        description="Check back later to browse products by category."
      />
    )
  }

  return (
    <section aria-labelledby="shop-by-category-title" className="mt-5">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="shop-by-category-title"
          className="text-section-heading font-bold text-text-primary"
        >
          Shop by Category
        </h2>

        <Link
          to="/products"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View All Categories
          <FiArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products?categoryId=${encodeURIComponent(category.id)}`}
            className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div className="overflow-hidden rounded-lg bg-secondary">
              {category.image.secureUrl ? (
                <img
                  src={category.image.secureUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-16/10 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="aspect-16/10 bg-linear-to-br from-primary to-emerald-950"
                />
              )}
            </div>

            <span className="mt-2 block px-1 text-center text-xs font-semibold text-text-primary transition-colors group-hover:text-primary sm:text-sm">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
