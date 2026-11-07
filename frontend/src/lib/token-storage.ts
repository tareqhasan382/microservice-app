const STORAGE_KEY = 'nova.accessToken'

/**
 * The access token is kept in memory for fast reads and mirrored to
 * localStorage so a refresh keeps the session. The refresh token lives in an
 * httpOnly cookie managed by the browser — never in JS reach.
 */
let accessToken: string | null = readInitial()

function readInitial(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export const tokenStorage = {
  get(): string | null {
    return accessToken
  },
  set(token: string | null): void {
    accessToken = token
    try {
      if (token) localStorage.setItem(STORAGE_KEY, token)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable — memory copy still works */
    }
  },
  clear(): void {
    tokenStorage.set(null)
  },
}
