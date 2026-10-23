import { Link } from 'react-router'

/**
 * Renders the fallback page when no application route matches the URL.
 */
export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-4">
      <section className="w-full max-w-xl rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-section-heading font-semibold text-text-primary">Page not found</h1>
        <p className="mt-2 text-body text-text-secondary">
          The page you requested could not be found.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 font-medium text-surface hover:bg-primary/90"
        >
          Return home
        </Link>
      </section>
    </main>
  )
}
