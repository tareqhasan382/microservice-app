import axios, { AxiosError } from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '../lib/token-storage'
import type { ApiResponse, AuthResult } from '../types'

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api'

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

/* --- Session-expiry signalling ------------------------- */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

/* --- Attach bearer token ------------------------------- */
client.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/* --- Transparent refresh-on-401 ------------------------ */
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string | null> | null = null

async function requestNewAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<ApiResponse<AuthResult>>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
    )
    const token = data.data?.accessToken ?? null
    tokenStorage.set(token)
    return token
  } catch {
    tokenStorage.clear()
    return null
  }
}

/** De-duplicates concurrent refreshes into a single in-flight request. */
function refreshAccessTokenOnce(): Promise<string | null> {
  refreshPromise ??= requestNewAccessToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = config?.url?.includes('/auth/') ?? false

    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true
      const token = await refreshAccessTokenOnce()
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
        return client.request(config)
      }
      onUnauthorized?.()
    }

    return Promise.reject(error)
  },
)

export default client
