import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useUsers } from '../../hooks/useUsers'
import { useAssignTask, useCreateTask, useUpdateTask } from '../../hooks/useTasks'
import { getErrorMessage } from '../../lib/errors'
import type { Task, TaskStatus } from '../../types'
import { Banner, Button, Field, Input, Modal, Select, Textarea } from '../ui'
import { AssigneePicker } from './AssigneePicker'

export interface TaskFormModalProps {
  open: boolean
  task?: Task | null
  onClose: () => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export function TaskFormModal({ open, task, onClose }: TaskFormModalProps) {
  const isEdit = Boolean(task)
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const usersQuery = useUsers({ page: 1, limit: 100 }, Boolean(isAdmin))
  const assignableMembers = useMemo(
    () => (usersQuery.data?.users ?? []).filter((member) => member.role === 'user'),
    [usersQuery.data],
  )
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const assignTask = useAssignTask()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [assigneeId, setAssigneeId] = useState('unassigned')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? 'pending')
    setAssigneeId(task?.assignee_id ? String(task.assignee_id) : 'unassigned')
    setError(null)
  }, [open, task])

  const submitting = createTask.isPending || updateTask.isPending || assignTask.isPending

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) {
      setError('A title is required.')
      return
    }
    try {
      const assignment = assigneeId === 'unassigned' ? null : Number(assigneeId)
      const payload = { title: title.trim(), description: description.trim(), status }
      if (task) {
        await updateTask.mutateAsync({ id: task.id, payload })
        if (isAdmin && assignment !== task.assignee_id) {
          await assignTask.mutateAsync({ id: task.id, assigneeId: assignment })
        }
      } else {
        await createTask.mutateAsync({
          ...payload,
          assigneeId: isAdmin ? assignment : null,
        })
      }
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      subtitle={isEdit ? `Task #${task?.id}` : 'Add something to your board'}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" variant="primary" loading={submitting}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" className="form-grid" onSubmit={handleSubmit}>
        {error ? <Banner tone="error">{error}</Banner> : null}

        <Field label="Title" htmlFor="task-title">
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Ship the notifications page"
            invalid={Boolean(error) && !title.trim()}
            autoFocus
          />
        </Field>

        <Field label="Description" htmlFor="task-description" hint="Optional">
          <Textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add context, links, acceptance criteria…"
          />
        </Field>

        <Field label="Status" htmlFor="task-status">
          <Select
            id="task-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {isAdmin ? (
          <Field
            label="Assignee"
            hint="Search a member to assign, or leave unassigned so a member can claim it."
            error={usersQuery.isError ? 'Could not load members for assignment.' : undefined}
          >
            <AssigneePicker
              members={assignableMembers}
              value={assigneeId === 'unassigned' ? null : Number(assigneeId)}
              loading={usersQuery.isLoading}
              onChange={(next) => setAssigneeId(next === null ? 'unassigned' : String(next))}
            />
          </Field>
        ) : null}
      </form>
    </Modal>
  )
}
