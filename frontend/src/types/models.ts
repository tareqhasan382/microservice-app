export type Role = 'admin' | 'user'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  image: string | null
  created_at?: string
  updated_at?: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  user_id: string
  created_by_id: number | null
  created_by_name?: string | null
  assignee_id: number | null
  assignee_name?: string | null
  assignee_email?: string | null
  total_minutes: number
  unread_comment_count?: number
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: number
  task_id: number
  author_id: number
  author_name: string
  body: string
  created_at: string
}

export interface TaskTimeEntry {
  id: number
  task_id: number
  user_id: number
  user_name: string
  minutes: number
  note: string | null
  created_at: string
}

export interface TaskAssignmentEvent {
  id: number
  task_id: number
  actor_id: number
  actor_name: string
  assignee_id: number | null
  assignee_name: string | null
  action: 'assigned' | 'reassigned' | 'claimed' | 'unassigned' | 'legacy_migrated'
  created_at: string
}

export interface Notification {
  id: number
  user_id: string
  message: string
  is_read: boolean
  created_at: string
}
