import { useContext } from 'react'
import { AuthContext } from '../auth-context'

/** Returns authentication state and actions from the nearest provider. */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.')
  }

  return context
}
