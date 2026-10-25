import { Navigate, Outlet, useLocation } from 'react-router'
import AuthLoadingScreen from '../features/auth/components/AuthLoadingScreen'
import { useAuth } from '../features/auth/hooks/useAuth'

interface ProtectedRouteProps {
  requiredRole?: string
}

/** Waits for authentication restoration and optionally checks a required role. */
export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
