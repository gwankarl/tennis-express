import { Route, Routes } from 'react-router'
import PublicLayout from '../components/layout/PublicLayout'
import WorkspaceLayout from '../components/layout/WorkspaceLayout'
import EmailVerificationPage from '../pages/EmailVerificationPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import RegistrationPage from '../pages/RegistrationPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import ProtectedRoute from './ProtectedRoute'
import UserSectionPage from '../pages/users/UserSectionPage'
import UserDashboardPage from '../pages/users/UserDashboardPage'
import UserProfilePage from '../pages/users/UserProfilePage'

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
          <Route path="settings" element={<UserSectionPage title="Settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
