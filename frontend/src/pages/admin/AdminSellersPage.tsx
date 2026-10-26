import { Link } from 'react-router'

import { PageHeading } from '../../components/layout/PageHeading'

/** Provides entry points for seller and storefront administration. */
export default function AdminSellersPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Sellers"
        description="Manage seller accounts and the storefronts they operate."
      />

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-section-heading font-semibold text-text-primary">Store management</h2>
        <p className="mt-2 text-body text-text-secondary">
          Review storefront details and manage store availability.
        </p>
        <Link
          to="/admin/stores"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Manage stores
        </Link>
      </section>
    </div>
  )
}
