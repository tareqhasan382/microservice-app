import axios from 'axios'
import type { ApiErrorBody } from '../types'

const FALLBACK = 'Something went wrong. Please try again.'

/**
 * Normalises any thrown value into a human-friendly message, preferring the
 * backend's response envelope `message` field.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.message) return body.message
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the API gateway. Is the backend running on :5000?'
    }
    if (error.response?.status) {
      return `${error.response.status} — ${error.response.statusText || 'Request failed'}`
    }
    return error.message || FALLBACK
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return FALLBACK
}
