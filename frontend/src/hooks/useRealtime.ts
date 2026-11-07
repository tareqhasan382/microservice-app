import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { queryKeys } from './query-keys'
import { createSocket, REALTIME_EVENTS } from '../lib/socket'

/**
 * Opens an authenticated realtime connection for the signed-in user and keeps
 * the react-query caches in sync. Incoming events invalidate the relevant
 * queries, so notifications, the unread badge and the task board update live —
 * no manual refresh or polling required.
 */
export function useRealtime(): void {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) return

    const socket = createSocket()

    socket.on(REALTIME_EVENTS.notificationNew, () => {
      // Covers both the notification list and the unread-count query.
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll })
    })

    socket.on(REALTIME_EVENTS.taskChanged, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll })
    })

    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated, queryClient])
}
