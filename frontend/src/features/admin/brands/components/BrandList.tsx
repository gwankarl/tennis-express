import { Button } from '../../../../components/ui/Button'
import { StatusLabel } from '../../../../components/ui/StatusLabel'
import type { Brand } from '../types'

interface BrandListProps {
  brands: Brand[]
  onEdit: (brand: Brand) => void
  onChangeStatus: (brand: Brand) => void
}

/** Displays brands with edit and status-management actions. */
export function BrandList({ brands, onEdit, onChangeStatus }: BrandListProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-2xl border-collapse text-left">
        <caption className="sr-only">Brand management list</caption>
        <thead className="bg-page">
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-3 text-supporting font-semibold text-text-secondary">
              Brand
            </th>
            <th scope="col" className="px-4 py-3 text-supporting font-semibold text-text-secondary">
              Slug
            </th>
            <th scope="col" className="px-4 py-3 text-supporting font-semibold text-text-secondary">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-supporting font-semibold text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {brands.map((brand) => {
            const nextStatus = brand.status === 'active' ? 'inactive' : 'active'

            return (
              <tr key={brand._id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {brand.logo ? (
                      <img
                        src={brand.logo.secureUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-md border border-border object-contain p-1"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-supporting font-semibold text-primary"
                      >
                        {brand.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="wrap-break-word text-body font-medium text-text-primary">
                      {brand.name}
                    </span>
                  </div>
                </td>

                <td className="break-all px-4 py-4 text-supporting text-text-secondary">
                  {brand.slug}
                </td>

                <td className="px-4 py-4">
                  <StatusLabel tone={brand.status === 'active' ? 'success' : 'neutral'}>
                    {brand.status}
                  </StatusLabel>
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => onEdit(brand)}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant={nextStatus === 'inactive' ? 'danger' : 'secondary'}
                      size="small"
                      aria-label={`${nextStatus === 'inactive' ? 'Deactivate' : 'Activate'} ${brand.name}`}
                      onClick={() => onChangeStatus(brand)}
                    >
                      {nextStatus === 'inactive' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
