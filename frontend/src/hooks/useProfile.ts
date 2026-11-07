import { useMutation } from '@tanstack/react-query'
import { usersApi } from '../api'
import { useAuth } from './useAuth'
import type { ChangePasswordPayload, UpdateProfilePayload } from '../types'

/** PATCH /api/users/me — also refreshes the cached auth user on success. */
export function useUpdateProfile() {
  const { updateUser } = useAuth()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersApi.updateMe(payload),
    onSuccess: (user) => updateUser(user),
  })
}

/** PUT /api/users/me/password */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => usersApi.changePassword(payload),
  })
}
