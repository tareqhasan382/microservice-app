import type { ListNotificationsQuery, ListQuery, ListTasksQuery } from '../types'

export const queryKeys = {
  tasks: (query: ListTasksQuery = {}) => ['tasks', query] as const,
  tasksAll: ['tasks'] as const,
  taskComments: (id: number | string, page = 1) => ['tasks', id, 'comments', page] as const,
  taskCommentsAll: (id: number | string) => ['tasks', id, 'comments'] as const,
  taskTimeEntries: (id: number | string, page = 1) => ['tasks', id, 'time-entries', page] as const,
  taskTimeEntriesAll: (id: number | string) => ['tasks', id, 'time-entries'] as const,
  taskAssignmentHistory: (id: number | string) => ['tasks', id, 'assignment-history'] as const,

  notifications: (query: ListNotificationsQuery = {}) => ['notifications', query] as const,
  notificationsAll: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,

  users: (query: ListQuery = {}) => ['users', query] as const,
  usersAll: ['users'] as const,
}
