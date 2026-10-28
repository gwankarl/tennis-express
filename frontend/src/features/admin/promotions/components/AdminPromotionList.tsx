import { Link } from 'react-router'

import { StatusLabel, type StatusTone } from '../../../../components/ui/StatusLabel'
import type { AdminPromotionListItem, AdminPromotionStatus } from '../types'

interface AdminPromotionListProps {
  promotions: AdminPromotionListItem[]
}

const statusTone: Record<AdminPromotionStatus, StatusTone> = {
  draft: 'neutral',
  scheduled: 'information',
  active: 'success',
  ended: 'neutral',
  cancelled: 'error',
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Unavailable'

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDiscount(promotion: AdminPromotionListItem): string {
  if (promotion.discountType === 'percentage') {
    return `${promotion.discountValue}%`
  }

  return `Fixed amount: ${promotion.discountValue}`
}

function PromotionType({ promotion }: { promotion: AdminPromotionListItem }) {
  if (promotion.type === 'marketplace_campaign') {
    return (
      <div>
        <p className="font-medium text-text-primary">Marketplace campaign</p>
        <p className="mt-1 text-supporting text-text-secondary">Platform-wide promotion</p>
      </div>
    )
  }

  return (
    <div>
      <p className="font-medium text-text-primary">Seller discount</p>
      <p className="mt-1 text-supporting text-text-secondary">
        {promotion.store?.name ?? promotion.seller?.userName ?? 'Seller unavailable'}
      </p>
    </div>
  )
}

/** Displays administrator promotions in a desktop table and mobile cards. */
export function AdminPromotionList({ promotions }: AdminPromotionListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
        <table className="w-full min-w-240 border-collapse text-left">
          <caption className="sr-only">Admin promotions</caption>
          <thead className="border-b border-border bg-page">
            <tr className="text-supporting font-medium text-text-secondary">
              <th scope="col" className="px-4 py-3">
                Promotion
              </th>
              <th scope="col" className="px-4 py-3">
                Type / owner
              </th>
              <th scope="col" className="px-4 py-3">
                Discount
              </th>
              <th scope="col" className="px-4 py-3">
                Schedule
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Products
              </th>
              <th scope="col" className="px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {promotions.map((promotion) => (
              <tr key={promotion._id}>
                <td className="px-4 py-4">
                  <p className="wrap-break-word font-medium text-text-primary">{promotion.name}</p>
                </td>
                <td className="px-4 py-4">
                  <PromotionType promotion={promotion} />
                </td>
                <td className="px-4 py-4 text-supporting text-text-primary">
                  {formatDiscount(promotion)}
                </td>
                <td className="px-4 py-4 text-supporting text-text-secondary">
                  <p>Starts {formatDate(promotion.startsAt)}</p>
                  <p className="mt-1">Ends {formatDate(promotion.endsAt)}</p>
                </td>
                <td className="px-4 py-4">
                  <StatusLabel tone={statusTone[promotion.status]}>{promotion.status}</StatusLabel>
                </td>
                <td className="px-4 py-4 text-supporting text-text-secondary">
                  {promotion.eligibleProductIds.length}
                </td>
                <td className="px-4 py-4">
                  <Link
                    to={`/admin/promotions/${encodeURIComponent(promotion._id)}`}
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

      <ul className="space-y-3 md:hidden">
        {promotions.map((promotion) => (
          <li
            key={promotion._id}
            className="space-y-4 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="wrap-break-word font-semibold text-text-primary">
                  {promotion.name}
                </h2>
                <div className="mt-2">
                  <PromotionType promotion={promotion} />
                </div>
              </div>

              <StatusLabel tone={statusTone[promotion.status]}>{promotion.status}</StatusLabel>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-supporting">
              <div>
                <dt className="text-text-secondary">Discount</dt>
                <dd className="mt-1 font-medium text-text-primary">{formatDiscount(promotion)}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Eligible products</dt>
                <dd className="mt-1 font-medium text-text-primary">
                  {promotion.eligibleProductIds.length}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-secondary">Starts</dt>
                <dd className="mt-1 text-text-primary">{formatDate(promotion.startsAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-secondary">Ends</dt>
                <dd className="mt-1 text-text-primary">{formatDate(promotion.endsAt)}</dd>
              </div>
            </dl>

            <Link
              to={`/admin/promotions/${encodeURIComponent(promotion._id)}`}
              className="inline-flex min-h-10 items-center text-supporting font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              View details
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
