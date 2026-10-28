import { Button } from '../../../../components/ui/Button'
import { StatusLabel, type StatusTone } from '../../../../components/ui/StatusLabel'
import type { AdminProductListItem, AdminProductReviewStatus } from '../types'

interface ModerationProductListProps {
  products: AdminProductListItem[]
  onReview: (productId: string) => void
}

const statusTone: Record<AdminProductReviewStatus, StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  changes_requested: 'information',
}

const statusLabel: Record<AdminProductReviewStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
}

function formatDate(value: string | null): string {
  if (!value) return 'Unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Unavailable'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCondition(condition: AdminProductListItem['condition']): string {
  if (condition === 'new') return 'New'
  if (condition === 'used') return 'Used'
  return 'Not specified'
}

function ProductImage({ product }: { product: AdminProductListItem }) {
  if (!product.primaryImage) {
    return (
      <div
        aria-hidden="true"
        className="size-14 shrink-0 rounded-md border border-border bg-page"
      />
    )
  }

  return (
    <img
      src={product.primaryImage.secureUrl}
      alt={product.primaryImage.altText || product.name || 'Product'}
      loading="lazy"
      className="size-14 shrink-0 rounded-md border border-border bg-page object-cover"
    />
  )
}

/** Shows moderation queue products as a desktop table and mobile cards. */
export function ModerationProductList({ products, onReview }: ModerationProductListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
        <table className="w-full min-w-180 border-collapse text-left">
          <thead className="border-b border-border bg-page">
            <tr className="text-supporting font-medium text-text-secondary">
              <th scope="col" className="px-4 py-3">
                Product
              </th>
              <th scope="col" className="px-4 py-3">
                Submitted
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Review
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <ProductImage product={product} />
                    <div className="min-w-0">
                      <p className="wrap-break-word font-medium text-text-primary">
                        {product.name || 'Untitled product'}
                      </p>
                      <p className="mt-1 text-supporting text-text-secondary">
                        Condition: {formatCondition(product.condition)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-supporting text-text-secondary">
                  {formatDate(product.submittedAt)}
                </td>
                <td className="px-4 py-4">
                  <StatusLabel tone={statusTone[product.moderationStatus]}>
                    {statusLabel[product.moderationStatus]}
                  </StatusLabel>
                </td>
                <td className="px-4 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={() => onReview(product.id)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {products.map((product) => (
          <li key={product.id} className="space-y-4 rounded-xl border border-border bg-surface p-4">
            <div className="flex min-w-0 items-start gap-3">
              <ProductImage product={product} />
              <div className="min-w-0 flex-1">
                <h2 className="wrap-break-word font-semibold text-text-primary">
                  {product.name || 'Untitled product'}
                </h2>
                <p className="mt-1 text-supporting text-text-secondary">
                  Condition: {formatCondition(product.condition)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <StatusLabel tone={statusTone[product.moderationStatus]}>
                  {statusLabel[product.moderationStatus]}
                </StatusLabel>
                <p className="text-supporting text-text-secondary">
                  Submitted {formatDate(product.submittedAt)}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={() => onReview(product.id)}
              >
                Review
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
