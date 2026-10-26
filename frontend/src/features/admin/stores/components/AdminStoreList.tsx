import { Link } from 'react-router'

import { StatusLabel } from '../../../../components/ui/StatusLabel'
import type { AdminStoreListItem } from '../types'

interface AdminStoreListProps {
  stores: AdminStoreListItem[]
}

/** Displays stores and links to their administrative detail pages. */
export function AdminStoreList({ stores }: AdminStoreListProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-3xl border-collapse text-left">
        <caption className="sr-only">Store management list</caption>
        <thead className="bg-page">
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-3 text-supporting font-semibold text-text-secondary">
              Store
            </th>
            <th scope="col" className="px-4 py-3 text-supporting font-semibold text-text-secondary">
              Seller ID
            </th>
            <th scope="col" className="px-4 py-3 text-supporting font-semibold text-text-secondary">
              Location
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
          {stores.map((store) => (
            <tr key={store.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  {store.logo ? (
                    <img
                      src={store.logo.secureUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-md border border-border object-contain p-1"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary font-semibold text-primary"
                    >
                      {store.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className="wrap-break-word font-medium text-text-primary">{store.name}</p>
                    <p className="break-all text-supporting text-text-secondary">{store.slug}</p>
                  </div>
                </div>
              </td>

              <td className="break-all px-4 py-4 text-supporting text-text-secondary">
                {store.sellerId}
              </td>

              <td className="px-4 py-4 text-supporting text-text-secondary">
                {store.location.city}, {store.location.region}
              </td>

              <td className="px-4 py-4">
                <StatusLabel tone={store.status === 'active' ? 'success' : 'warning'}>
                  {store.status}
                </StatusLabel>
              </td>

              <td className="px-4 py-4">
                <Link
                  to={`/admin/stores/${encodeURIComponent(store.id)}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-supporting font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
