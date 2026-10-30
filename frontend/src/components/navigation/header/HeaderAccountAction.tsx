import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiUser } from 'react-icons/fi'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { getCurrentUser, currentUserQueryKey } from '../../../features/users/api/currentUser'
import { useAuth } from '../../../features/auth/hooks/useAuth'

const dashboardOptions = [
  { role: 'admin', label: 'Admin dashboard', to: '/admin' },
  { role: 'seller', label: 'Seller dashboard', to: '/seller' },
  { role: 'customer', label: 'Customer dashboard', to: '/customer' },
] as const

const accountMenuId = 'header-account-menu'

/** Shows account access and a dropdown with the dashboards available to the current user. */
export default function HeaderAccountAction() {
  const { status, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: status === 'authenticated',
  })

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const initials =
    user?.userName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  if (status === 'loading') {
    return <span aria-hidden="true" className="h-10 w-24 shrink-0" />
  }

  const isSignedIn = status === 'authenticated' && user !== null
  const accountLabel = isSignedIn ? user.userName.trim().split(/\s+/)[0] || 'Account' : 'Sign in'
  const availableDashboards = isSignedIn
    ? dashboardOptions.filter((option) => user.roles.includes(option.role))
    : []

  return (
    <div ref={accountRef} className="relative shrink-0 ">
      <button
        ref={triggerRef}
        type="button"
        aria-label={isSignedIn ? `Account for ${user.userName}` : 'Sign in or create an account'}
        aria-expanded={isOpen}
        aria-controls={accountMenuId}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex cursor-pointer min-h-11 items-center gap-2 rounded-md px-2 py-1 text-left text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isSignedIn ? (
          currentUserQuery.data?.profile.image ? (
            <img
              src={currentUserQuery.data.profile.image.secureUrl}
              alt=""
              aria-hidden="true"
              className="size-8 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary"
            >
              {initials}
            </span>
          )
        ) : (
          <FiUser aria-hidden="true" className="size-5 shrink-0" />
        )}
        <span className="grid leading-tight">
          <span className="text-xs font-medium text-primary">{accountLabel}</span>
          <span className="text-sm font-semibold">Account</span>
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-text-secondary transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id={accountMenuId}
        hidden={!isOpen}
        className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface p-2 shadow-lg"
      >
        {isSignedIn ? (
          <nav aria-label="Account dashboards" className="grid gap-1">
            {availableDashboards.length > 0 ? (
              availableDashboards.map((option) => (
                <Link
                  key={option.role}
                  to={option.to}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {option.label}
                </Link>
              ))
            ) : (
              <span className="px-3 py-2 text-sm text-text-secondary">
                No dashboards are available for this account.
              </span>
            )}
          </nav>
        ) : (
          <nav aria-label="Account access" className="grid gap-1">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Create an account
            </Link>
          </nav>
        )}
      </div>
    </div>
  )
}
