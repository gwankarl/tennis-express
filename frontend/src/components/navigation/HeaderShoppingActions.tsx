import { Link } from 'react-router'
import { FiHeart, FiShoppingCart } from 'react-icons/fi'
import type { AuthUser } from '../../features/auth/types'
import { useCartSummary } from '../../features/cart/hooks/useCartSummary'
import { useWishlistSummary } from '../../features/wishlist/hooks/useWishlistSummary'

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
    <nav aria-label="Shopping" className="flex items-center gap-4">
      <Link
        to={destination}
        aria-label={
          user
            ? `Wishlist${wishlistCount === undefined ? '' : `, ${wishlistCount} items`}`
            : 'Sign in to view your wishlist'
        }
        className="relative inline-flex items-center gap-2"
      >
        <FiHeart aria-hidden="true" />
        <span>Wishlist</span>
        {user && wishlistCount !== undefined && <span aria-hidden="true">{wishlistCount}</span>}
      </Link>

      <Link
        to={cartDestination}
        aria-label={
          user
            ? `Cart${cartCount === undefined ? '' : `, ${cartCount} items`}`
            : 'Sign in to view your cart'
        }
        className="relative inline-flex items-center gap-2"
      >
        <FiShoppingCart aria-hidden="true" />
        <span>Cart</span>
        {user && cartCount !== undefined && <span aria-hidden="true">{cartCount}</span>}
      </Link>
    </nav>
  )
}
