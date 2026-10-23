import { Link, NavLink, Outlet } from 'react-router'

export type WorkspaceRole = 'customer' | 'seller' | 'admin'

export interface WorkspaceNavigationItem {
  label: string
  to: string
  /** Set true when the link should be active only at its exact path. */
  end?: boolean
}

interface WorkspaceLayoutProps {
  role: WorkspaceRole
  navigationItems: readonly WorkspaceNavigationItem[]
}

const roleLabels: Record<WorkspaceRole, string> = {
  customer: 'Customer workspace',
  seller: 'Seller workspace',
  admin: 'Admin workspace',
}

/**
 * Renders the shared authenticated-workspace shell.
 * Role routes provide the navigation items for their workspace.
 */
export default function WorkspaceLayout({ role, navigationItems }: WorkspaceLayoutProps) {
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

          <p className="text-supporting font-medium text-text-secondary">{roleLabels[role]}</p>
        </div>
      </header>

      <nav
        aria-label={`${roleLabels[role]} navigation`}
        className="border-b border-border bg-surface"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-2 px-4 py-3 sm:px-6 lg:px-8">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-supporting font-medium',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-text-secondary hover:bg-page hover:text-text-primary',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main
        id="workspace-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
      >
        <Outlet />
      </main>
    </div>
  )
}
