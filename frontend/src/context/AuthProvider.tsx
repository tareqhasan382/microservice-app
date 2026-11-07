import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi, setUnauthorizedHandler, usersApi } from '../api'
import { tokenStorage } from '../lib/token-storage'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'
import type { LoginPayload, RegisterPayload, User } from '../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const queryClient = useQueryClient()

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  /* Restore the session from a persisted access token (or refresh cookie). */
  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (!tokenStorage.get()) {
        setIsBootstrapping(false)
        return
      }
      try {
        const me = await usersApi.me()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [clearSession])

  /* The API client tells us when a silent refresh has failed. */
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession())
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload)
    tokenStorage.set(result.accessToken)
    setUser(result.user)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload)
    // Auto sign-in right after registration for a frictionless first run.
    const result = await authApi.login({ email: payload.email, password: payload.password })
    tokenStorage.set(result.accessToken)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* the local session is dropped regardless of the server response */
    }
    clearSession()
  }, [clearSession])

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isBootstrapping, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
