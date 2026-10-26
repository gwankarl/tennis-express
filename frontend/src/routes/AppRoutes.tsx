import { Route, Routes } from 'react-router'
import {
  FiArchive,
  FiHome,
  FiMessageSquare,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiShoppingCart,
} from 'react-icons/fi'
import PublicLayout from '../components/layout/PublicLayout'
import WorkspaceLayout from '../components/layout/WorkspaceLayout'
import AdminWorkspaceLayout from '../components/layout/AdminWorkspaceLayout'
import EmailVerificationPage from '../pages/EmailVerificationPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import RegistrationPage from '../pages/RegistrationPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import UserDashboardPage from '../pages/users/UserDashboardPage'
import UserProfilePage from '../pages/users/UserProfilePage'
import UserSectionPage from '../pages/users/UserSectionPage'
import SellerApplicationsPage from '../pages/users/SellerApplicationsPage'
import AdminSellerApplicationsPage from '../pages/admin/AdminSellerApplicationsPage'
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage'
import AdminBrandsPage from '../pages/admin/AdminBrandsPage'
import ProtectedRoute from './ProtectedRoute'
import PublicStorePage from '../pages/stores/PublicStorePage'
import SellerStorePage from '../pages/sellers/SellerStorePage'

/** Organizes public and authenticated routes with a global not-found fallback. */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="register" element={<RegistrationPage />} />
        <Route path="verify-email" element={<EmailVerificationPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="stores/:slug" element={<PublicStorePage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="customer"
          element={
            <WorkspaceLayout
              role="customer"
              navigationItems={[
                { label: 'Overview', to: '/customer', end: true },
                { label: 'My Orders', to: '/customer/orders', end: true },
                { label: 'Wishlist', to: '/customer/wishlist', end: true },
                { label: 'Messages', to: '/customer/messages', end: true },
                { label: 'My Profile', to: '/customer/profile', end: true },
                { label: 'Seller Applications', to: '/customer/seller-applications', end: true },
                { label: 'Settings', to: '/customer/settings', end: true },
              ]}
            />
          }
        >
          <Route index element={<UserDashboardPage />} />
          <Route path="orders" element={<UserSectionPage title="Orders" />} />
          <Route path="wishlist" element={<UserSectionPage title="Wishlist" />} />
          <Route path="messages" element={<UserSectionPage title="Messages" />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="seller-applications" element={<SellerApplicationsPage />} />
          <Route path="settings" element={<UserSectionPage title="Settings" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRole="seller" />}>
        <Route
          path="seller"
          element={
            <WorkspaceLayout
              role="seller"
              navigationItems={[
                { label: 'Overview', to: '/seller', Icon: FiHome, end: true },
                { label: 'Products', to: '/seller/products', Icon: FiPackage, end: true },
                { label: 'Inventory', to: '/seller/inventory', Icon: FiArchive, end: true },
                { label: 'Orders', to: '/seller/orders', Icon: FiShoppingCart, end: true },
                { label: 'Storefront', to: '/seller/store', Icon: FiShoppingBag, end: true },
                { label: 'Messages', to: '/seller/messages', Icon: FiMessageSquare, end: true },
                { label: 'Settings', to: '/seller/settings', Icon: FiSettings, end: true },
              ]}
            />
          }
        >
          <Route index element={<UserSectionPage title="Seller overview" />} />
          <Route path="products" element={<UserSectionPage title="Products" />} />
          <Route path="inventory" element={<UserSectionPage title="Inventory" />} />
          <Route path="orders" element={<UserSectionPage title="Orders" />} />
          <Route path="store" element={<SellerStorePage />} />
          <Route path="messages" element={<UserSectionPage title="Messages" />} />
          <Route path="settings" element={<UserSectionPage title="Settings" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="admin" element={<AdminWorkspaceLayout />}>
          <Route index element={<UserSectionPage title="Platform overview" />} />
          <Route path="users" element={<UserSectionPage title="Users" />} />
          <Route path="sellers" element={<UserSectionPage title="Sellers" />} />
          <Route path="seller-applications" element={<AdminSellerApplicationsPage />} />
          <Route path="products" element={<UserSectionPage title="Product moderation" />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="orders" element={<UserSectionPage title="Orders" />} />
          <Route path="disputes" element={<UserSectionPage title="Disputes" />} />
          <Route path="settings" element={<UserSectionPage title="Platform settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
