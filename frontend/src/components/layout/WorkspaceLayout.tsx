import { Link, NavLink, Outlet } from 'react-router'
import LogoutButton from './LogoutButton'

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
 * Renders the shared authenticated-workspace shell with responsive navigation.
 * Role routes provide the links shown in the sidebar and mobile navigation.
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

          <div className="flex items-center gap-3">
            <p className="hidden text-supporting font-medium text-text-secondary sm:block">
              {roleLabels[role]}
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row lg:px-8">
        <nav
          aria-label={`${roleLabels[role]} navigation`}
          className="border-b border-border bg-surface lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r"
        >
          <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:sticky lg:top-0 lg:flex-col lg:overflow-visible lg:px-4 lg:py-8">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'shrink-0 rounded-md px-3 py-2 text-supporting font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
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

        <main id="workspace-content" className="w-full min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
