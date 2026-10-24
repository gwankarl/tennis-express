import { Link } from 'react-router'
import { EmptyState } from '../../components/feedback/EmptyState'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../features/auth/hooks/useAuth'

/** Shows the user welcome, account shortcuts, and recent-order empty state. */
export default function UserDashboardPage() {
  const { user } = useAuth()
  const firstName = user?.userName.trim().split(/\s+/)[0] || 'there'

  return (
    <div className="space-y-8">
      <PageHeading
        title={`Welcome, ${firstName}`}
        description="Your user overview"
        action={
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Continue shopping
          </Link>
        }
      />

      <section aria-labelledby="account-summary-heading" className="space-y-4">
        <h2
          id="account-summary-heading"
          className="text-section-heading font-semibold text-text-primary"
        >
          Your account
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="text-card-heading font-semibold text-text-primary">Orders</h3>
            <p className="mt-2 text-supporting text-text-secondary">
              Your order summary will appear here when order history is available.
            </p>
            <Link
              to="/customer/orders"
              className="mt-4 inline-flex min-h-10 items-center text-supporting font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              View my orders
            </Link>
          </article>

          <article className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="text-card-heading font-semibold text-text-primary">Wishlist</h3>
            <p className="mt-2 text-supporting text-text-secondary">
              Saved items will appear here when wishlist data is available.
            </p>
            <Link
              to="/customer/wishlist"
              className="mt-4 inline-flex min-h-10 items-center text-supporting font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              View wishlist
            </Link>
          </article>
        </div>
      </section>

      <section aria-labelledby="recent-orders-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="recent-orders-heading"
            className="text-section-heading font-semibold text-text-primary"
          >
            Recent orders
          </h2>

          <Link to="/customer/orders">
            <Button variant="outline" size="small">
              View all orders
            </Button>
          </Link>
        </div>

        <EmptyState
          title="No recent orders to show"
          description="Your recent orders will appear here when order history is available."
        />
      </section>
    </div>
  )
}
