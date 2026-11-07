import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api'
import { queryKeys } from './query-keys'
import type { ListQuery, UpdateUserPayload } from '../types'

export function useUsers(query: ListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users(query),
    queryFn: () => usersApi.list(query),
    enabled,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usersAll }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => usersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usersAll }),
  })
}
