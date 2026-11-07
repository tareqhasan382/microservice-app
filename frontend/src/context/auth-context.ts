import { createContext } from 'react'
import type { LoginPayload, RegisterPayload, User } from '../types'

export interface AuthContextValue {
  /** The signed-in user, or `null` when anonymous. */
  user: User | null
  isAuthenticated: boolean
  /** True while the initial session restore is in flight. */
  isBootstrapping: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  /** Patch the in-memory user (e.g. after a profile update). */
  updateUser: (patch: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
