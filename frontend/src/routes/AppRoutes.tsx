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
import CustomerDashboardPage from '../pages/customers/CustomerDashboardPage'
import CustomerOrdersPage from '../pages/customers/CustomerOrdersPage'
import ProtectedRoute from './ProtectedRoute'

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
                { label: 'Dashboard', to: '/customer', end: true },
                { label: 'Orders', to: '/customer/orders' },
              ]}
            />
          }
        >
          <Route index element={<CustomerDashboardPage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
