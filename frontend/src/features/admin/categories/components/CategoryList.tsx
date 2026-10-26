import { Button } from '../../../../components/ui/Button'
import { StatusLabel } from '../../../../components/ui/StatusLabel'
import type { Category } from '../types'

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
}

/** Displays categories with their images, status, and edit action. */
export function CategoryList({ categories, onEdit }: CategoryListProps) {
  return (
    <ul className="grid gap-4">
      {categories.map((category) => (
        <li key={category._id}>
          <article className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
            <img
              src={category.image.secureUrl}
              alt={`${category.name} category`}
              className="size-20 rounded-lg border border-border object-cover"
            />

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="wrap-break-word text-card-heading font-semibold text-text-primary">
                  {category.name}
                </h2>

                <StatusLabel tone={category.status === 'active' ? 'success' : 'neutral'}>
                  {category.status}
                </StatusLabel>
              </div>

              <p className="break-all text-supporting text-text-secondary">/{category.slug}</p>

              <p className="text-supporting text-text-secondary">
                {category.parentId ? `Parent ID: ${category.parentId}` : 'Root category'}
                {' · '}
                Sort order {category.sortOrder}
              </p>

              {category.description && (
                <p className="line-clamp-2 text-supporting text-text-secondary">
                  {category.description}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onEdit(category)}
            >
              Edit
            </Button>
          </article>
        </li>
      ))}
    </ul>
  )
}
