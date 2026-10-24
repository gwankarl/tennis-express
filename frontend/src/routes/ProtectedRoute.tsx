import { Navigate, Outlet, useLocation } from 'react-router'
import AuthLoadingScreen from '../features/auth/components/AuthLoadingScreen'
import { useAuth } from '../features/auth/hooks/useAuth'

/** Waits for authentication restoration before showing protected routes. */
export default function ProtectedRoute() {
  const { isAuthenticated, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
