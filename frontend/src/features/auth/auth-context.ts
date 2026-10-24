import { createContext } from 'react'
import type { AuthUser } from './types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  signIn: (user: AuthUser, accessToken: string) => void
  signOut: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
