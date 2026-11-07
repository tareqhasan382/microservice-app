/** Shared HTTP envelope returned by every backend endpoint. */
export interface ApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

export interface ApiErrorBody {
  success: false
  statusCode: number
  message: string
  errors?: unknown
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ListQuery {
  page?: number
  limit?: number
}
