import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { getApiError } from '../../../lib/apiError'
import { usePublicBrands } from '../hooks/usePublicBrands'

/** Displays active brand logos and links each one to its product results. */
export default function FeaturedBrandsSection() {
  const brandsQuery = usePublicBrands()

  if (brandsQuery.isPending) {
    return <LoadingState label="Loading brands…" />
  }

  if (brandsQuery.isError) {
    const apiError = getApiError(brandsQuery.error)

    return (
      <ErrorState
        title="Featured brands are unavailable"
        description={apiError.message}
        onRetry={() => void brandsQuery.refetch()}
      />
    )
  }

  const brands = brandsQuery.data.slice(0, 8)

  if (brands.length === 0) {
    return (
      <EmptyState title="No brands available" description="Check back later to browse brands." />
    )
  }

  return (
    <section aria-labelledby="featured-brands-title" className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 id="featured-brands-title" className="text-section-heading font-bold text-text-primary">
          Featured Brands
        </h2>

        <Link
          to="/brands"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View All Brands
          <FiArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              to={`/products?brandId=${encodeURIComponent(brand.id)}`}
              aria-label={`Browse ${brand.name} products`}
              className="flex aspect-3/2 items-center justify-center rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {brand.logo?.secureUrl ? (
                <img
                  src={brand.logo.secureUrl}
                  alt={brand.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-center text-sm font-bold text-text-primary">
                  {brand.name}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
