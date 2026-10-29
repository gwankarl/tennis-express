import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import LogoutButton from '../layout/LogoutButton'
import ProductSearchForm from './ProductSearchForm'
import PublicPrimaryNavigation from './PublicPrimaryNavigation'
import { usePublicCategories } from '../../features/categories/hooks/usePublicCategories'
import HeaderShoppingActions from './HeaderShoppingActions'

const dashboardDestinations = [
  { role: 'customer', label: 'User Dashboard', to: '/customer' },
  { role: 'seller', label: 'Seller Dashboard', to: '/seller' },
  { role: 'admin', label: 'Admin Dashboard', to: '/admin' },
] as const

interface AccountDropdownProps {
  userName: string
  roles: string[]
}

/** Shows account details, role-authorized dashboard links, and logout. */
function AccountDropdown({ userName, roles }: AccountDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownId = 'account-navigation'

  const availableDashboards = dashboardDestinations.filter((destination) =>
    roles.includes(destination.role),
  )

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  useEffect(() => {
    if (!isDropdownOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isDropdownOpen}
        aria-controls={dropdownId}
        aria-label={`Account options for ${userName}`}
        onClick={() => setIsDropdownOpen((open) => !open)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-2 py-1 text-supporting font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary"
        >
          {initials}
        </span>
        <span className="hidden max-w-36 truncate sm:inline">{userName}</span>
        <span aria-hidden="true">{isDropdownOpen ? '▴' : '▾'}</span>
      </button>

      {isDropdownOpen && (
        <div
          id={dropdownId}
          className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-3 shadow-lg"
        >
          <p className="truncate px-2 py-1 text-supporting font-semibold text-text-primary">
            {userName}
          </p>

          {availableDashboards.length > 0 && (
            <nav aria-label="Your dashboards" className="mt-2 grid gap-1">
              {availableDashboards.map((destination) => (
                <Link
                  key={destination.role}
                  to={destination.to}
                  onClick={() => setIsDropdownOpen(false)}
                  className="rounded-md px-2 py-2 text-supporting text-text-secondary hover:bg-page hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {destination.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="mt-2 border-t border-border pt-3">
            <LogoutButton className="w-full" />
          </div>
        </div>
      )}
    </div>
  )
}

/** Renders the shared public header and role-aware account menu. */
export default function Header() {
  const { user } = useAuth()
  const location = useLocation()
  const categoriesQuery = usePublicCategories()
  const categories = categoriesQuery.data ?? []

  return (
    <header className="relative z-20 border-b border-border bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 py-3 sm:gap-5 sm:py-4">
          <Link to="/" className="shrink-0 text-xl font-bold text-primary">
            Tennis-Xpress
          </Link>

          <div className="order-3 w-full sm:order-2 sm:flex-1">
            <ProductSearchForm key={`${location.pathname}${location.search}`} />
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-4 sm:order-3 sm:ml-0">
            <HeaderShoppingActions user={user} />

            {user ? (
              <AccountDropdown key={location.key} userName={user.userName} roles={user.roles} />
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-supporting font-medium text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-primary px-3 py-2 text-supporting font-medium text-surface hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border">
          <PublicPrimaryNavigation categories={categories} />
        </div>
      </div>
    </header>
  )
}
