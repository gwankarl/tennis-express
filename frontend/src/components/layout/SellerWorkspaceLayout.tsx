import {
  FiHome,
  FiMessageSquare,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiShoppingCart,
  FiTag,
} from 'react-icons/fi'

import WorkspaceLayout from './WorkspaceLayout'
import type { WorkspaceNavigationItem } from './WorkspaceLayout'

const sellerNavigationItems: readonly WorkspaceNavigationItem[] = [
  { label: 'Overview', to: '/seller', Icon: FiHome, end: true },
  { label: 'My Products', to: '/seller/products', Icon: FiPackage, end: true },
  { label: 'Promotions', to: '/seller/promotions', Icon: FiTag, end: true },
  { label: 'Orders', to: '/seller/orders', Icon: FiShoppingCart, end: true },
  { label: 'My Store', to: '/seller/store', Icon: FiShoppingBag, end: true },
  { label: 'Messages', to: '/seller/messages', Icon: FiMessageSquare, end: true },
  { label: 'Settings', to: '/seller/settings', Icon: FiSettings, end: true },
]

/** Renders the seller workspace shell with seller-specific navigation. */
export default function SellerWorkspaceLayout() {
  return <WorkspaceLayout role="seller" navigationItems={sellerNavigationItems} />
}
