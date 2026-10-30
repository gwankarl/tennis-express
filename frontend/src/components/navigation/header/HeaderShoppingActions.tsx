import { Link } from 'react-router'
import { FiHeart, FiShoppingCart } from 'react-icons/fi'
import type { AuthUser } from '../../../features/auth/types'
import { useCartSummary } from '../../../features/cart/hooks/useCartSummary'
import { useWishlistSummary } from '../../../features/wishlist/hooks/useWishlistSummary'

interface HeaderShoppingActionsProps {
  user: AuthUser | null
}

export default function HeaderShoppingActions({ user }: HeaderShoppingActionsProps) {
  const isCustomer = user?.roles.includes('customer') ?? false
  const userId = isCustomer ? user?.id : undefined
  const cartQuery = useCartSummary(userId)
  const wishlistQuery = useWishlistSummary(userId)

  if (user && !isCustomer) {
    return null
  }

  const wishlistCount = wishlistQuery.data?.pagination.totalItems
  const cartCount = cartQuery.data?.totalQuantity
  const destination = user ? '/customer/wishlist' : '/login'
  const cartDestination = user ? '/customer/cart' : '/login'

  return (
    <nav aria-label="Shopping" className="flex shrink-0 items-center gap-4">
      <Link
        to={destination}
        aria-label={
          user
            ? `Wishlist${wishlistCount === undefined ? '' : `, ${wishlistCount} items`}`
            : 'Sign in to view your wishlist'
        }
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="relative inline-flex">
          <FiHeart aria-hidden="true" className="size-5" />
          {user && wishlistCount !== undefined && wishlistCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white"
            >
              {wishlistCount > 99 ? '99+' : wishlistCount}
            </span>
          )}
        </span>
        <span>Wishlist</span>
      </Link>

      <Link
        to={cartDestination}
        aria-label={
          user
            ? `Cart${cartCount === undefined ? '' : `, ${cartCount} items`}`
            : 'Sign in to view your cart'
        }
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="relative inline-flex">
          <FiShoppingCart aria-hidden="true" className="size-5" />
          {user && cartCount !== undefined && cartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white"
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </span>
        <span>Cart</span>
      </Link>
    </nav>
  )
}
