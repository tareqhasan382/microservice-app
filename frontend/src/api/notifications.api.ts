import client from './client'
import type {
  ApiResponse,
  CreateNotificationPayload,
  ListNotificationsQuery,
  Notification,
  PaginationMeta,
} from '../types'

export interface NotificationListData {
  notifications: Notification[]
  meta: PaginationMeta
}

export const notificationsApi = {
  /** GET /api/notifications — optionally filter to `unread=true`. */
  async list(query: ListNotificationsQuery = {}): Promise<NotificationListData> {
    const { data } = await client.get<ApiResponse<NotificationListData>>('/notifications', {
      params: query,
    })
    return data.data
  },

  /** POST /api/notifications — `userId` is admin-only for other users. */
  async create(payload: CreateNotificationPayload): Promise<Notification> {
    const { data } = await client.post<ApiResponse<Notification>>('/notifications', payload)
    return data.data
  },

  /** PATCH /api/notifications/read-all */
  async markAllRead(): Promise<void> {
    await client.patch('/notifications/read-all')
  },

  /** PATCH /api/notifications/:id/read */
  async markRead(id: number | string): Promise<Notification> {
    const { data } = await client.patch<ApiResponse<Notification>>(`/notifications/${id}/read`)
    return data.data
  },

  /** DELETE /api/notifications/:id */
  async remove(id: number | string): Promise<void> {
    await client.delete(`/notifications/${id}`)
  },
}
