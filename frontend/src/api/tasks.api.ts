import client from './client'
import type {
  ApiResponse,
  CreateTaskPayload,
  ListTasksQuery,
  PaginationMeta,
  Task,
  TaskAssignmentEvent,
  TaskComment,
  TaskTimeEntry,
  UpdateTaskPayload,
} from '../types'

export interface TaskListData {
  tasks: Task[]
  meta: PaginationMeta
}

export interface TaskCommentListData {
  comments: TaskComment[]
  meta: PaginationMeta
}

export interface TaskTimeEntryListData {
  entries: TaskTimeEntry[]
  meta: PaginationMeta
}

export const tasksApi = {
  /** GET /api/tasks — own tasks, or every task for admins. */
  async list(query: ListTasksQuery = {}): Promise<TaskListData> {
    const { data } = await client.get<ApiResponse<TaskListData>>('/tasks', { params: query })
    return data.data
  },

  /** POST /api/tasks */
  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await client.post<ApiResponse<Task>>('/tasks', payload)
    return data.data
  },

  /** GET /api/tasks/:id */
  async get(id: number | string): Promise<Task> {
    const { data } = await client.get<ApiResponse<Task>>(`/tasks/${id}`)
    return data.data
  },

  /** PATCH /api/tasks/:id */
  async update(id: number | string, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await client.patch<ApiResponse<Task>>(`/tasks/${id}`, payload)
    return data.data
  },

  /** PATCH /api/tasks/:id/assignment — administrators only. */
  async assign(id: number | string, assigneeId: number | null): Promise<Task> {
    const { data } = await client.patch<ApiResponse<Task>>(`/tasks/${id}/assignment`, { assigneeId })
    return data.data
  },

  /** POST /api/tasks/:id/claim — members can atomically claim open tasks. */
  async claim(id: number | string): Promise<Task> {
    const { data } = await client.post<ApiResponse<Task>>(`/tasks/${id}/claim`)
    return data.data
  },

  async listComments(id: number | string, page = 1, limit = 20): Promise<TaskCommentListData> {
    const { data } = await client.get<ApiResponse<TaskCommentListData>>(`/tasks/${id}/comments`, {
      params: { page, limit },
    })
    return data.data
  },

  async addComment(id: number | string, body: string): Promise<TaskComment> {
    const { data } = await client.post<ApiResponse<TaskComment>>(`/tasks/${id}/comments`, { body })
    return data.data
  },

  /** POST /api/tasks/:id/comments/read — clears the unread-comment badge. */
  async markCommentsRead(id: number | string): Promise<void> {
    await client.post(`/tasks/${id}/comments/read`)
  },

  async listTimeEntries(
    id: number | string,
    page = 1,
    limit = 20,
  ): Promise<TaskTimeEntryListData> {
    const { data } = await client.get<ApiResponse<TaskTimeEntryListData>>(
      `/tasks/${id}/time-entries`,
      { params: { page, limit } },
    )
    return data.data
  },

  async addTimeEntry(
    id: number | string,
    payload: { minutes: number; note?: string },
  ): Promise<TaskTimeEntry> {
    const { data } = await client.post<ApiResponse<TaskTimeEntry>>(
      `/tasks/${id}/time-entries`,
      payload,
    )
    return data.data
  },

  async assignmentHistory(id: number | string): Promise<TaskAssignmentEvent[]> {
    const { data } = await client.get<ApiResponse<TaskAssignmentEvent[]>>(
      `/tasks/${id}/assignment-history`,
    )
    return data.data
  },

  /** DELETE /api/tasks/:id */
  async remove(id: number | string): Promise<void> {
    await client.delete(`/tasks/${id}`)
  },
}
