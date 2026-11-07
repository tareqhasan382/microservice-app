import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api'
import type { TaskListData } from '../api'
import { queryKeys } from './query-keys'
import type { CreateTaskPayload, ListTasksQuery, UpdateTaskPayload } from '../types'

export function useTasks(query: ListTasksQuery = {}) {
  return useQuery({
    queryKey: queryKeys.tasks(query),
    queryFn: () => tasksApi.list(query),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll }),
  })
}

export interface UpdateTaskVariables {
  id: number | string
  payload: UpdateTaskPayload
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateTaskVariables) => tasksApi.update(id, payload),

    /* Optimistic update so status toggles feel instant. */
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasksAll })
      const previous = queryClient.getQueriesData<TaskListData>({ queryKey: queryKeys.tasksAll })
      previous.forEach(([key, data]) => {
        if (!data) return
        queryClient.setQueryData<TaskListData>(key, {
          ...data,
          tasks: data.tasks.map((task) =>
            String(task.id) === String(id) ? { ...task, ...payload } : task,
          ),
        })
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => tasksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll }),
  })
}

export function useAssignTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: number | string; assigneeId: number | null }) =>
      tasksApi.assign(id, assigneeId),
    onSuccess: (_task, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.taskAssignmentHistory(id),
      })
    },
  })
}

export function useClaimTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => tasksApi.claim(id),
    onSuccess: (_task, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.taskAssignmentHistory(id),
      })
    },
  })
}

export function useTaskComments(id: number | string, enabled = true, page = 1) {
  return useQuery({
    queryKey: queryKeys.taskComments(id, page),
    queryFn: () => tasksApi.listComments(id, page),
    enabled,
  })
}

export function useAddTaskComment(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => tasksApi.addComment(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.taskCommentsAll(id) })
    },
  })
}

export function useMarkCommentsRead(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => tasksApi.markCommentsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll })
    },
  })
}

export function useTaskTimeEntries(id: number | string, enabled = true, page = 1) {
  return useQuery({
    queryKey: queryKeys.taskTimeEntries(id, page),
    queryFn: () => tasksApi.listTimeEntries(id, page),
    enabled,
  })
}

export function useAddTaskTimeEntry(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { minutes: number; note?: string }) =>
      tasksApi.addTimeEntry(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.taskTimeEntriesAll(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasksAll })
    },
  })
}

export function useTaskAssignmentHistory(id: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskAssignmentHistory(id),
    queryFn: () => tasksApi.assignmentHistory(id),
    enabled,
  })
}
