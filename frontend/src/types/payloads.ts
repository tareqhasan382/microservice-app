import type { ListQuery } from './api'
import type { Role, TaskStatus, User } from './models'

/* --- Auth ---------------------------------------------- */
export interface RegisterPayload {
  name: string
  email: string
  password: string
  image?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResult {
  user: User
  accessToken: string
}

/* --- Users --------------------------------------------- */
export interface UpdateProfilePayload {
  name?: string
  image?: string | null
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface UpdateUserPayload {
  name?: string
  image?: string | null
  role?: Role
}

/* --- Tasks --------------------------------------------- */
export interface ListTasksQuery extends ListQuery {
  status?: TaskStatus
  search?: string
  assignee?: number | 'unassigned'
}

export interface CreateTaskPayload {
  title: string
  description?: string
  status?: TaskStatus
  assigneeId?: number | null
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  status?: TaskStatus
}

/* --- Notifications ------------------------------------- */
export interface ListNotificationsQuery extends ListQuery {
  unread?: boolean
}

export interface CreateNotificationPayload {
  message: string
  userId?: string
}
