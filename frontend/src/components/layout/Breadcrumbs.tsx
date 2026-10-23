import { Link } from 'react-router'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[]
}

/**
 * Renders caller-provided navigation ancestors and marks the final item as the current page.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-supporting text-text-secondary">
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-border">
                  /
                </span>
              )}

              {isCurrentPage ? (
                <span aria-current="page" className="font-medium text-text-primary">
                  {item.label}
                </span>
              ) : item.to ? (
                <Link to={item.to} className="hover:text-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
