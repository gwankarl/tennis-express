import { Link, useLocation } from 'react-router'
import ProductSearchForm from './header/ProductSearchForm'
import DeliveryLocationSelector from './header/DeliveryLocationSelector'
import HeaderAccountAction from './header/HeaderAccountAction'
import HeaderShoppingActions from './header/HeaderShoppingActions'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { usePublicCategories } from '../../features/categories/hooks/usePublicCategories'
import ShopByCategoryMenu from './header/ShopByCategoryMenu'
import HeaderQuickLinks from './header/HeaderQuickLinks'

/** Renders the Tennis-Xpress brand and product search. */
export default function Header() {
  const location = useLocation()
  const { user } = useAuth()
  const categoriesQuery = usePublicCategories()
  const categories = categoriesQuery.data ?? []

  return (
    <header className="">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4 lg:px-8">
        <Link
          to="/"
          aria-label="Tennis-Xpress home"
          className="inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <img
            src="/images/tennis-xpress-logo.png"
            alt=""
            aria-hidden="true"
            className="size-10 shrink-0 object-contain sm:size-11"
          />

          <span className="whitespace-nowrap text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Tennis<span className="text-brand-accent">-Xpress</span>
          </span>
        </Link>

        <div className="order-2 w-full min-w-0 sm:order-0 sm:flex-1">
          <ProductSearchForm key={`${location.pathname}${location.search}`} />
        </div>

        <DeliveryLocationSelector />

        <HeaderAccountAction />

        <HeaderShoppingActions user={user} />
      </div>

      <div className="border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-x-18 px-4 sm:px-6 lg:px-8">
          <ShopByCategoryMenu categories={categories} />
          <HeaderQuickLinks categories={categories} />
        </div>
      </div>
    </header>
  )
}
