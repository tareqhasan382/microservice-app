import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api'
import { queryKeys } from './query-keys'
import type { CreateNotificationPayload, ListNotificationsQuery } from '../types'

export function useNotifications(query: ListNotificationsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.notifications(query),
    queryFn: () => notificationsApi.list(query),
  })
}

/** Total unread count, derived from the list endpoint's pagination meta. */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: async () => {
      const { meta } = await notificationsApi.list({ unread: true, page: 1, limit: 1 })
      return meta.total
    },
    enabled,
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) => notificationsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => notificationsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll }),
  })
}
