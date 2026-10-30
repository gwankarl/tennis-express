import { Link } from 'react-router'
import type { PublicCategory } from '../../../features/categories/types'

interface HeaderQuickLinksProps {
  categories: PublicCategory[]
}

const categoryLinkLabels = ['Rackets', 'Shoes', 'Apparel', 'Bags', 'Accessories', 'Balls']

const destinationLinks = [
  { label: 'Brands', to: '/brands' },
  { label: 'Deals', to: '/deals' },
  { label: 'Stores', to: '/stores' },
]

function normalizeCategoryLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getCategoryDestination(label: string, categories: PublicCategory[]) {
  const normalizedLabel = normalizeCategoryLabel(label)
  const category = categories.find((item) => {
    const normalizedName = normalizeCategoryLabel(item.name)
    const normalizedSlug = normalizeCategoryLabel(item.slug)

    return normalizedName.includes(normalizedLabel) || normalizedSlug.includes(normalizedLabel)
  })

  return category
    ? `/products?categoryId=${encodeURIComponent(category.id)}`
    : `/products?q=${encodeURIComponent(label)}`
}

/** Shows the prominent category and marketplace shortcuts from the homepage design. */
export default function HeaderQuickLinks({ categories }: HeaderQuickLinksProps) {
  return (
    <nav
      aria-label="Browse Tennis-Xpress"
      className="flex min-w-0 items-center gap-8 overflow-x-auto py-2 sm:justify-between sm:gap-10 sm:py-3"
    >
      {categoryLinkLabels.map((label) => (
        <Link
          key={label}
          to={getCategoryDestination(label, categories)}
          className="shrink-0 text-sm font-medium text-text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {label}
        </Link>
      ))}

      {destinationLinks.map(({ label, to }) => (
        <Link
          key={label}
          to={to}
          className={`shrink-0 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            label === 'Deals'
              ? 'text-red-600 hover:text-red-700'
              : 'text-text-primary hover:text-primary'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
