import { StatusLabel } from '../../../../../components/ui/StatusLabel'
import { Button } from '../../../../../components/ui/Button'
import type { PaginationMetadata, SellerProductVariant } from '../../types'

interface SellerProductVariantListProps {
  variants: SellerProductVariant[]
  pagination: PaginationMetadata
  isUpdatingStatus: boolean
  onPageChange: (page: number) => void
  onEdit: (variant: SellerProductVariant) => void
  onToggleStatus: (variant: SellerProductVariant) => void
}

function VariantStatus({ status }: { status: SellerProductVariant['status'] }) {
  return (
    <StatusLabel tone={status === 'active' ? 'success' : 'neutral'}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </StatusLabel>
  )
}

function VariantAttributes({ attributes }: { attributes?: Record<string, string> | null }) {
  const entries = Object.entries(attributes ?? {})

  if (entries.length === 0) {
    return <span className="text-text-secondary">No options</span>
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {entries.map(([name, value]) => (
        <li key={name} className="rounded-md bg-page px-2 py-1 text-supporting text-text-secondary">
          {name}: {value}
        </li>
      ))}
    </ul>
  )
}

function VariantActions({
  variant,
  isUpdatingStatus,
  onEdit,
  onToggleStatus,
}: {
  variant: SellerProductVariant
  isUpdatingStatus: boolean
  onEdit: () => void
  onToggleStatus: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="small" onClick={onEdit}>
        Edit
      </Button>
      <Button
        type="button"
        variant="outline"
        size="small"
        disabled={isUpdatingStatus}
        onClick={onToggleStatus}
      >
        {variant.status === 'active' ? 'Deactivate' : 'Activate'}
      </Button>
    </div>
  )
}

/** Displays variants in a desktop table and responsive mobile cards. */
export function SellerProductVariantList({
  variants,
  pagination,
  isUpdatingStatus,
  onPageChange,
  onEdit,
  onToggleStatus,
}: SellerProductVariantListProps) {
  return (
    <section aria-labelledby="product-variants-heading" className="space-y-4">
      <h3
        id="product-variants-heading"
        className="text-card-heading font-semibold text-text-primary"
      >
        Variants
      </h3>

      {variants.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-body text-text-secondary">
          No variants have been added yet.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
            <table className="w-full min-w-200 border-collapse text-left">
              <thead className="border-b border-border bg-page">
                <tr className="text-supporting font-medium text-text-secondary">
                  <th scope="col" className="px-4 py-3">
                    Variant
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Options
                  </th>
                  <th scope="col" className="px-4 py-3">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {variants.map((variant) => (
                  <tr key={variant._id}>
                    <td className="px-4 py-4 font-medium text-text-primary">
                      {variant.name}
                      {variant.isDefault && (
                        <span className="ml-2 text-supporting text-text-secondary">Default</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <VariantAttributes attributes={variant.attributes} />
                    </td>
                    <td className="px-4 py-4 text-supporting text-text-secondary">
                      {variant.sku || '-'}
                    </td>
                    <td className="px-4 py-4 text-supporting text-text-primary">
                      {variant.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-supporting text-text-primary">
                      {variant.stockQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <VariantStatus status={variant.status} />
                    </td>
                    <td className="px-4 py-4">
                      <VariantActions
                        variant={variant}
                        isUpdatingStatus={isUpdatingStatus}
                        onEdit={() => onEdit(variant)}
                        onToggleStatus={() => onToggleStatus(variant)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {variants.map((variant) => (
              <li
                key={variant._id}
                className="space-y-3 rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-text-primary">{variant.name}</h4>
                    {variant.isDefault && (
                      <p className="mt-1 text-supporting text-text-secondary">Default variant</p>
                    )}
                  </div>
                  <VariantStatus status={variant.status} />
                </div>

                <VariantAttributes attributes={variant.attributes} />

                <dl className="grid grid-cols-2 gap-3 text-supporting">
                  <div>
                    <dt className="text-text-secondary">SKU</dt>
                    <dd className="mt-1 text-text-primary">{variant.sku || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">Price</dt>
                    <dd className="mt-1 text-text-primary">{variant.price.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">Stock</dt>
                    <dd className="mt-1 text-text-primary">
                      {variant.stockQuantity.toLocaleString()}
                    </dd>
                  </div>
                </dl>

                <VariantActions
                  variant={variant}
                  isUpdatingStatus={isUpdatingStatus}
                  onEdit={() => onEdit(variant)}
                  onToggleStatus={() => onToggleStatus(variant)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {pagination.totalPages > 1 && (
        <nav
          aria-label="Variant pages"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-supporting text-text-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="small"
              disabled={!pagination.hasPreviousPage}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="small"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </section>
  )
}
