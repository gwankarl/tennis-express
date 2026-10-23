import { Button } from './Button'

export interface PaginationProps {
  /** The currently selected page, starting at 1. */
  currentPage: number
  /** Number of items displayed on each page. */
  pageSize: number
  /** Total number of available items. */
  totalItems: number
  /** Called with the selected page number. */
  onPageChange: (page: number) => void
}

/**
 * Renders previous and next controls with the current item range.
 */
export function Pagination({ currentPage, pageSize, totalItems, onPageChange }: PaginationProps) {
  const safePageSize = Math.max(1, pageSize)
  const totalPages = Math.ceil(totalItems / safePageSize)
  const page = totalPages === 0 ? 0 : Math.min(Math.max(currentPage, 1), totalPages)
  const firstItem = totalItems === 0 ? 0 : (page - 1) * safePageSize + 1
  const lastItem = Math.min(page * safePageSize, totalItems)

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p aria-live="polite" className="text-supporting text-text-secondary">
        {totalItems === 0 ? 'No items' : `Showing ${firstItem}–${lastItem} of ${totalItems}`}
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="small"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>

        <span className="text-supporting text-text-secondary">
          {totalPages === 0 ? 'No pages' : `Page ${page} of ${totalPages}`}
        </span>

        <Button
          variant="outline"
          size="small"
          onClick={() => onPageChange(page + 1)}
          disabled={page === 0 || page >= totalPages}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
