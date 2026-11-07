import client from './client'
import type {
  ApiResponse,
  ChangePasswordPayload,
  ListQuery,
  PaginationMeta,
  UpdateProfilePayload,
  UpdateUserPayload,
  User,
} from '../types'

export interface UserListData {
  users: User[]
  meta: PaginationMeta
}

export const usersApi = {
  /** GET /api/users/me */
  async me(): Promise<User> {
    const { data } = await client.get<ApiResponse<User>>('/users/me')
    return data.data
  },

  /** PATCH /api/users/me */
  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await client.patch<ApiResponse<User>>('/users/me', payload)
    return data.data
  },

  /** PUT /api/users/me/password */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await client.put('/users/me/password', payload)
  },

  /** GET /api/users — admin only */
  async list(query: ListQuery = {}): Promise<UserListData> {
    const { data } = await client.get<ApiResponse<UserListData>>('/users', { params: query })
    return data.data
  },

  /** GET /api/users/:id — admin only */
  async get(id: number | string): Promise<User> {
    const { data } = await client.get<ApiResponse<User>>(`/users/${id}`)
    return data.data
  },

  /** PATCH /api/users/:id — admin only */
  async update(id: number | string, payload: UpdateUserPayload): Promise<User> {
    const { data } = await client.patch<ApiResponse<User>>(`/users/${id}`, payload)
    return data.data
  },

  /** DELETE /api/users/:id — admin only */
  async remove(id: number | string): Promise<void> {
    await client.delete(`/users/${id}`)
  },
}
