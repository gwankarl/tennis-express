import { Route, Routes } from 'react-router'

import PublicLayout from '../components/layout/PublicLayout'
import WorkspaceLayout from '../components/layout/WorkspaceLayout'
import AdminWorkspaceLayout from '../components/layout/AdminWorkspaceLayout'
import SellerWorkspaceLayout from '../components/layout/SellerWorkspaceLayout'
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
import AdminSellersPage from '../pages/admin/AdminSellersPage'
import AdminStoresPage from '../pages/admin/AdminStoresPage'
import AdminStoreDetailsPage from '../pages/admin/AdminStoreDetailsPage'
import SellerStorePage from '../pages/sellers/SellerStorePage'
import SellerProductsPage from '../pages/sellers/SellerProductsPage'
import SellerProductEditorPage from '../pages/sellers/SellerProductEditorPage'
import AdminProductModerationPage from '../pages/admin/AdminProductModerationPage'
import AdminProductReviewPage from '../pages/admin/AdminProductReviewPage'
import SellerPromotionsPage from '../pages/sellers/SellerPromotionsPage'
import SellerPromotionDetailsPage from '../pages/sellers/SellerPromotionDetailsPage'
import SellerPromotionFormPage from '../pages/sellers/SellerPromotionFormPage'
import SellerDashboardPage from '../pages/sellers/SellerDashboardPage'
import AdminPromotionsPage from '../pages/admin/AdminPromotionsPage'
import AdminPromotionDetailsPage from '../pages/admin/AdminPromotionDetailsPage'
import AdminPromotionFormPage from '../pages/admin/AdminPromotionFormPage'
import PublicProductSearchPage from '../pages/products/PublicProductSearchPage'

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
        <Route path="products" element={<PublicProductSearchPage />} />
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
        <Route path="seller" element={<SellerWorkspaceLayout />}>
          <Route index element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="products/new" element={<SellerProductEditorPage />} />
          <Route path="products/:productId" element={<SellerProductEditorPage />} />
          <Route path="promotions" element={<SellerPromotionsPage />} />
          <Route path="promotions/new" element={<SellerPromotionFormPage />} />
          <Route path="promotions/:promotionId/edit" element={<SellerPromotionFormPage />} />
          <Route path="promotions/:promotionId" element={<SellerPromotionDetailsPage />} />
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
          <Route path="sellers" element={<AdminSellersPage />} />
          <Route path="stores" element={<AdminStoresPage />} />
          <Route path="stores/:storeId" element={<AdminStoreDetailsPage />} />
          <Route path="seller-applications" element={<AdminSellerApplicationsPage />} />
          <Route path="products" element={<AdminProductModerationPage />} />
          <Route path="products/:productId" element={<AdminProductReviewPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="promotions/new" element={<AdminPromotionFormPage />} />
          <Route path="promotions/:promotionId/edit" element={<AdminPromotionFormPage />} />
          <Route path="promotions/:promotionId" element={<AdminPromotionDetailsPage />} />
          <Route path="orders" element={<UserSectionPage title="Orders" />} />
          <Route path="disputes" element={<UserSectionPage title="Disputes" />} />
          <Route path="settings" element={<UserSectionPage title="Platform settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
