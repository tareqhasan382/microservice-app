import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { tokenStorage } from './token-storage'
import type { Notification, Task } from '../types'

/** Server → client realtime event names (must mirror notification-service). */
export const REALTIME_EVENTS = {
  notificationNew: 'notification:new',
  taskChanged: 'task:changed',
} as const

export interface TaskChangedPayload {
  action: 'created' | 'updated' | 'deleted'
  task: Pick<Task, 'id' | 'title' | 'status' | 'user_id'>
}

export interface ServerToClientEvents {
  [REALTIME_EVENTS.notificationNew]: (notification: Notification) => void
  [REALTIME_EVENTS.taskChanged]: (payload: TaskChangedPayload) => void
}

/** Optional absolute hub URL; falls back to the page origin (proxied by Vite). */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

/**
 * Opens an authenticated Socket.IO connection. The access token is resolved on
 * every (re)connection attempt via the `auth` callback, so token refreshes are
 * picked up automatically instead of being frozen at connect time.
 */
export function createSocket(): Socket<ServerToClientEvents> {
  const options = {
    path: '/socket.io',
    withCredentials: true,
    auth: (cb: (data: { token: string }) => void) => cb({ token: tokenStorage.get() ?? '' }),
  } as const

  return SOCKET_URL ? io(SOCKET_URL, options) : io(options)
}
