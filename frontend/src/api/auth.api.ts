import client from './client'
import type { ApiResponse, AuthResult, LoginPayload, RegisterPayload, User } from '../types'

export const authApi = {
  /** POST /api/auth/register — creates an account with role `user`. */
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await client.post<ApiResponse<User>>('/auth/register', payload)
    return data.data
  },

  /** POST /api/auth/login — returns the access token + sets the refresh cookie. */
  async login(payload: LoginPayload): Promise<AuthResult> {
    const { data } = await client.post<ApiResponse<AuthResult>>('/auth/login', payload)
    return data.data
  },

  /** POST /api/auth/refresh — rotates the access token from the refresh cookie. */
  async refresh(): Promise<AuthResult> {
    const { data } = await client.post<ApiResponse<AuthResult>>('/auth/refresh', {})
    return data.data
  },

  /** POST /api/auth/logout — revokes the refresh token server-side. */
  async logout(): Promise<void> {
    await client.post('/auth/logout', {})
  },
}
