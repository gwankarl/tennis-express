import { Link, Outlet } from 'react-router'

/**
 * Provides the shared public header, page area, and footer.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold text-primary">
            Tennis-Xpress
          </Link>

          <nav aria-label="Main navigation">
            <Link
              to="/"
              className="text-supporting font-medium text-text-secondary hover:text-primary"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-supporting text-text-secondary">
            © {new Date().getFullYear()} Tennis Xpress
          </p>
        </div>
      </footer>
    </div>
  )
}
