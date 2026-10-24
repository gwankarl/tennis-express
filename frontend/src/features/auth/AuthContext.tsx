import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearAccessToken, setAccessToken } from '../../lib/authToken'
import { queryClient } from '../../lib/queryClient'
import AuthLoadingScreen from './components/AuthLoadingScreen'
import { logout as requestLogout } from './api/logout'
import { refreshSession } from './api/refreshSession'
import { AuthContext, type AuthStatus } from './auth-context'
import type { AuthUser } from './types'

interface AuthProviderProps {
  children: ReactNode
}

interface AuthState {
  user: AuthUser | null
  status: AuthStatus
}

/** Restores the session before rendering application routes. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    status: 'loading',
  })

  useEffect(() => {
    let isMounted = true

    refreshSession()
      .then((response) => {
        if (!isMounted) return

        setAccessToken(response.data.accessToken)
        setAuthState({
          user: response.data.user,
          status: 'authenticated',
        })
      })
      .catch(() => {
        if (!isMounted) return

        clearAccessToken()
        queryClient.clear()
        setAuthState({
          user: null,
          status: 'unauthenticated',
        })
      })

    return () => {
      isMounted = false
    }
  }, [])

  const signIn = useCallback((user: AuthUser, accessToken: string) => {
    setAccessToken(accessToken)
    setAuthState({
      user,
      status: 'authenticated',
    })
  }, [])

  const signOut = useCallback(async (): Promise<boolean> => {
    let requestFailed = false

    try {
      await requestLogout()
    } catch {
      requestFailed = true
    } finally {
      clearAccessToken()
      queryClient.clear()
      setAuthState({
        user: null,
        status: 'unauthenticated',
      })
    }

    return requestFailed
  }, [])

  const contextValue = useMemo(
    () => ({
      user: authState.user,
      status: authState.status,
      isAuthenticated: authState.status === 'authenticated',
      signIn,
      signOut,
    }),
    [authState, signIn, signOut],
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {authState.status === 'loading' ? <AuthLoadingScreen /> : children}
    </AuthContext.Provider>
  )
}
