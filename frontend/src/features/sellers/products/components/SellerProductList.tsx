import { Link } from 'react-router'

import { Button } from '../../../../components/ui/Button'
import { StatusLabel, type StatusTone } from '../../../../components/ui/StatusLabel'
import type { ProductModerationStatus, ProductPublicationStatus, SellerProduct } from '../types'

interface SellerProductListProps {
  products: SellerProduct[]
  pendingProductId: string | null
  onArchive: (product: SellerProduct) => void
  onRestore: (product: SellerProduct) => void
  onPublish: (product: SellerProduct) => void
  onDelete: (product: SellerProduct) => void
}

const moderationLabels: Record<ProductModerationStatus, string> = {
  not_submitted: 'Not submitted',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
}

const moderationTones: Record<ProductModerationStatus, StatusTone> = {
  not_submitted: 'neutral',
  pending: 'information',
  approved: 'success',
  rejected: 'error',
  changes_requested: 'warning',
}

const publicationLabels: Record<ProductPublicationStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

const publicationTones: Record<ProductPublicationStatus, StatusTone> = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning',
}

function formatDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function ProductStatuses({ product }: { product: SellerProduct }) {
  const hasDecision =
    product.moderationStatus === 'approved' ||
    product.moderationStatus === 'rejected' ||
    product.moderationStatus === 'changes_requested'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <StatusLabel tone={moderationTones[product.moderationStatus]}>
          {moderationLabels[product.moderationStatus]}
        </StatusLabel>
        <StatusLabel tone={publicationTones[product.publicationStatus]}>
          {publicationLabels[product.publicationStatus]}
        </StatusLabel>
      </div>

      {hasDecision && product.reviewedAt && (
        <p className="text-supporting text-text-secondary">
          Reviewed {formatDate(product.reviewedAt)}
        </p>
      )}

      {(product.moderationStatus === 'rejected' ||
        product.moderationStatus === 'changes_requested') &&
        product.moderationReason && (
          <p className="max-w-prose text-supporting text-text-secondary">
            <span className="font-semibold text-text-primary">
              {product.moderationStatus === 'rejected'
                ? 'Rejection reason: '
                : 'Requested changes: '}
            </span>
            {product.moderationReason}
          </p>
        )}
    </div>
  )
}

function ProductActions({
  product,
  isPending,
  onArchive,
  onRestore,
  onPublish,
  onDelete,
}: {
  product: SellerProduct
  isPending: boolean
  onArchive: (product: SellerProduct) => void
  onRestore: (product: SellerProduct) => void
  onPublish: (product: SellerProduct) => void
  onDelete: (product: SellerProduct) => void
}) {
  const isUnsubmittedDraft =
    product.publicationStatus === 'draft' && product.moderationStatus === 'not_submitted'
  const isCorrectionDraft =
    product.publicationStatus === 'draft' && product.moderationStatus === 'changes_requested'
  const isApprovedDraft =
    product.publicationStatus === 'draft' && product.moderationStatus === 'approved'
  const isApprovedPublished =
    product.publicationStatus === 'published' && product.moderationStatus === 'approved'
  const isApprovedArchived =
    product.publicationStatus === 'archived' && product.moderationStatus === 'approved'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(isUnsubmittedDraft || isCorrectionDraft) && (
        <Link
          to={`/seller/products/${product._id}`}
          className="inline-flex min-h-9 items-center rounded-md border border-border px-3 py-1.5 text-supporting font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Edit
        </Link>
      )}

      {isUnsubmittedDraft && (
        <Button
          type="button"
          size="small"
          variant="danger"
          disabled={isPending}
          onClick={() => onDelete(product)}
        >
          {isPending ? 'Deleting…' : 'Delete'}
        </Button>
      )}

      {isApprovedDraft && (
        <Button type="button" size="small" disabled={isPending} onClick={() => onPublish(product)}>
          {isPending ? 'Publishing…' : 'Publish'}
        </Button>
      )}

      {isApprovedPublished && (
        <Button
          type="button"
          size="small"
          variant="outline"
          disabled={isPending}
          onClick={() => onArchive(product)}
        >
          {isPending ? 'Archiving…' : 'Archive'}
        </Button>
      )}

      {isApprovedArchived && (
        <Button
          type="button"
          size="small"
          variant="outline"
          disabled={isPending}
          onClick={() => onRestore(product)}
        >
          {isPending ? 'Restoring…' : 'Restore'}
        </Button>
      )}
    </div>
  )
}

/** Displays products as a table on larger screens and cards on mobile. */
export function SellerProductList({
  products,
  pendingProductId,
  onArchive,
  onRestore,
  onPublish,
  onDelete,
}: SellerProductListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
        <table className="w-full min-w-190 border-collapse text-left">
          <thead className="border-b border-border bg-page">
            <tr className="text-supporting font-medium text-text-secondary">
              <th scope="col" className="px-4 py-3">
                Product
              </th>
              <th scope="col" className="px-4 py-3">
                Condition
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Updated
              </th>
              <th scope="col" className="px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const primaryImage =
                product.images.find((image) => image.isPrimary) ?? product.images[0]

              return (
                <tr key={product._id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {primaryImage ? (
                        <img
                          src={primaryImage.secureUrl}
                          alt={primaryImage.altText || product.name || 'Product'}
                          loading="lazy"
                          className="size-12 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="size-12 rounded-md border border-border bg-page"
                        />
                      )}
                      <span className="font-medium text-text-primary">
                        {product.name || 'Untitled draft'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-supporting text-text-secondary">
                    {product.condition === 'new'
                      ? 'New'
                      : product.condition === 'used'
                        ? 'Used'
                        : 'Not set'}
                  </td>
                  <td className="px-4 py-4">
                    <ProductStatuses product={product} />
                  </td>
                  <td className="px-4 py-4 text-supporting text-text-secondary">
                    {formatDate(product.updatedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <ProductActions
                      product={product}
                      isPending={pendingProductId === product._id}
                      onArchive={onArchive}
                      onRestore={onRestore}
                      onPublish={onPublish}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {products.map((product) => {
          const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0]

          return (
            <li key={product._id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex gap-3">
                {primaryImage ? (
                  <img
                    src={primaryImage.secureUrl}
                    alt={primaryImage.altText || product.name || 'Product'}
                    loading="lazy"
                    className="size-16 shrink-0 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="size-16 shrink-0 rounded-md border border-border bg-page"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="wrap-break-word font-semibold text-text-primary">
                    {product.name || 'Untitled draft'}
                  </h2>
                  <p className="mt-1 text-supporting text-text-secondary">
                    Condition:{' '}
                    {product.condition === 'new'
                      ? 'New'
                      : product.condition === 'used'
                        ? 'Used'
                        : 'Not set'}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <ProductStatuses product={product} />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-supporting text-text-secondary">
                  Updated {formatDate(product.updatedAt)}
                </p>
                <ProductActions
                  product={product}
                  isPending={pendingProductId === product._id}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onPublish={onPublish}
                  onDelete={onDelete}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
