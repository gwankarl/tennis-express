import { Link, Outlet } from 'react-router'
import LogoutButton from './LogoutButton'
import { AdminNavigation } from '../navigation/AdminNavigation'

/** Renders the responsive shell for authenticated administrator pages. */
export default function AdminWorkspaceLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page text-text-primary">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to workspace content
      </a>

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold text-primary">
            Tennis-Xpress
          </Link>

          <div className="flex items-center gap-3">
            <p className="hidden text-supporting font-medium text-text-secondary sm:block">
              Admin workspace
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row lg:px-8">
        <AdminNavigation />

        <main id="workspace-content" className="w-full min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
