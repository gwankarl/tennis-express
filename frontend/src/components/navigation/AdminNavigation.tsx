import { NavLink } from 'react-router'
import type { IconType } from 'react-icons'
import {
  FiAlertCircle,
  FiFileText,
  FiGrid,
  FiHome,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiShoppingCart,
  FiTag,
  FiUsers,
} from 'react-icons/fi'

const navigationItems: {
  label: string
  to: string
  Icon: IconType
  end?: boolean
}[] = [
  { label: 'Overview', to: '/admin', Icon: FiHome, end: true },
  { label: 'Users', to: '/admin/users', Icon: FiUsers, end: true },
  { label: 'Sellers', to: '/admin/sellers', Icon: FiShoppingBag, end: true },
  {
    label: 'Seller Applications',
    to: '/admin/seller-applications',
    Icon: FiFileText,
    end: true,
  },
  { label: 'Product Moderation', to: '/admin/products', Icon: FiPackage, end: true },
  { label: 'Categories', to: '/admin/categories', Icon: FiGrid, end: true },
  { label: 'Brands', to: '/admin/brands', Icon: FiTag, end: true },
  { label: 'Orders', to: '/admin/orders', Icon: FiShoppingCart, end: true },
  { label: 'Disputes', to: '/admin/disputes', Icon: FiAlertCircle, end: true },
  { label: 'Platform Settings', to: '/admin/settings', Icon: FiSettings, end: true },
]

/** Renders admin workspace navigation for mobile and desktop layouts. */
export function AdminNavigation() {
  return (
    <nav
      aria-label="Admin workspace navigation"
      className="border-b border-border bg-surface lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r"
    >
      <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:sticky lg:top-0 lg:flex-col lg:overflow-visible lg:px-4 lg:py-8">
        {navigationItems.map(({ label, to, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'inline-flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-supporting font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isActive
                  ? 'bg-secondary text-primary'
                  : 'text-text-secondary hover:bg-page hover:text-text-primary',
              ].join(' ')
            }
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
