import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskRow } from '../components/tasks/TaskRow'
import { TaskActivityModal } from '../components/tasks/TaskActivityModal'
import { IconLayers, IconPlus, IconSearch, IconTasks } from '../components/icons'
import { Banner, Button, Card, ConfirmDialog, EmptyState, LoadingBlock, Pagination } from '../components/ui'
import { Select } from '../components/ui/Select'
import { useAuth } from '../hooks/useAuth'
import { useClaimTask, useAssignTask, useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks'
import { useUsers } from '../hooks/useUsers'
import { getErrorMessage } from '../lib/errors'
import type { Task, TaskStatus } from '../types'

const PAGE_SIZE = 8
const BOARD_PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 200
const TaskBoard = lazy(() =>
  import('../components/tasks/TaskBoard').then(({ TaskBoard: Board }) => ({ default: Board })),
)

type StatusFilter = TaskStatus | 'all'
type TaskView = 'board' | 'list'

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export function TasksPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [view, setView] = useState<TaskView>('board')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [activity, setActivity] = useState<Task | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const usersQuery = useUsers({ page: 1, limit: 100 }, Boolean(isAdmin))
  const members = useMemo(
    () => (usersQuery.data?.users ?? []).filter((member) => member.role === 'user'),
    [usersQuery.data],
  )

  // Debounce typing so the server is queried at a steady pace.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const tasksQuery = useTasks({
    page,
    limit: view === 'board' ? BOARD_PAGE_SIZE : PAGE_SIZE,
    status: view === 'list' && filter !== 'all' ? filter : undefined,
    search: search || undefined,
    assignee:
      isAdmin && assigneeFilter !== 'all'
        ? assigneeFilter === 'unassigned'
          ? 'unassigned'
          : Number(assigneeFilter)
        : undefined,
  })

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const claimTask = useClaimTask()
  const assignTask = useAssignTask()

  const data = tasksQuery.data
  const tasks = data?.tasks ?? []
  const meta = data?.meta

  const runTaskAction = async (id: number, action: () => Promise<unknown>, message: string) => {
    setError(null)
    setBusyId(String(id))
    try {
      await action()
    } catch (err) {
      setError(`${message} ${getErrorMessage(err)}`)
    } finally {
      setBusyId(null)
    }
  }

  const handleMoveStatus = async (task: Task, status: TaskStatus) => {
    if (task.status === status || updateTask.isPending) return
    await runTaskAction(task.id, () => updateTask.mutateAsync({ id: task.id, payload: { status } }), `Could not move "${task.title}".`)
  }

  const handleToggle = (task: Task) =>
    runTaskAction(
      task.id,
      () =>
        updateTask.mutateAsync({
          id: task.id,
          payload: { status: task.status === 'done' ? 'pending' : 'done' },
        }),
      'Could not update the task.',
    )

  const handleClaim = (task: Task) =>
    runTaskAction(task.id, () => claimTask.mutateAsync(task.id), `Could not claim "${task.title}".`)

  const handleAssign = (task: Task, assigneeId: number | null) =>
    runTaskAction(
      task.id,
      () => assignTask.mutateAsync({ id: task.id, assigneeId }),
      `Could not reassign "${task.title}".`,
    )

  const handleDelete = async () => {
    if (!deleting) return
    setError(null)
    try {
      await deleteTask.mutateAsync(deleting.id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const changeView = (next: TaskView) => {
    setView(next)
    setFilter('all')
    setPage(1)
  }

  const changeFilter = (next: StatusFilter) => {
    setFilter(next)
    setPage(1)
  }

  const changeAssigneeFilter = (next: string) => {
    setAssigneeFilter(next)
    setPage(1)
  }

  const boardProps = {
    updating: updateTask.isPending,
    isAdmin: Boolean(isAdmin),
    currentUserId: user?.id,
    members,
    onMoveStatus: handleMoveStatus,
    onClaim: handleClaim,
    onAssign: handleAssign,
    onOpenActivity: setActivity,
    onEdit: setEditing,
    onDelete: setDeleting,
  }

  return (
    <div className="stack">
      <div className="toolbar task-toolbar">
        {view === 'list' ? (
          <div className="pill-toggle" role="group" aria-label="Filter tasks by status">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="pill-toggle__option"
                aria-pressed={filter === option.value}
                onClick={() => changeFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="task-search">
          <IconSearch width={16} height={16} />
          <input
            type="search"
            className="task-search__input"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search tasks, people, descriptions…"
            aria-label="Search tasks"
          />
        </div>

        {isAdmin ? (
          <Select
            className="task-toolbar__assignee"
            value={assigneeFilter}
            onChange={(event) => changeAssigneeFilter(event.target.value)}
            aria-label="Filter by assignee"
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={String(member.id)}>
                {member.name}
              </option>
            ))}
          </Select>
        ) : null}

        <span className="toolbar__spacer" />
        <div className="pill-toggle task-view-toggle" role="group" aria-label="Task view">
          <button
            type="button"
            className="pill-toggle__option"
            aria-pressed={view === 'board'}
            onClick={() => changeView('board')}
          >
            <IconLayers width={15} height={15} />
            Board
          </button>
          <button
            type="button"
            className="pill-toggle__option"
            aria-pressed={view === 'list'}
            onClick={() => changeView('list')}
          >
            <IconTasks width={15} height={15} />
            List
          </button>
        </div>
        {isAdmin ? (
          <Button variant="primary" icon={<IconPlus width={17} height={17} />} onClick={() => setCreating(true)}>
            New task
          </Button>
        ) : null}
      </div>

      {!isAdmin ? (
        <Banner tone="info">
          Admins create tasks. Browse the board below and <strong className="strong">claim</strong> an open
          task to assign it to yourself, then track progress with feedback and time.
        </Banner>
      ) : null}

      {error ? <Banner tone="error">{error}</Banner> : null}

      {tasksQuery.isError ? (
        <Card>
          <Banner tone="error">
            We could not load your tasks. The API gateway might be offline.
          </Banner>
        </Card>
      ) : (
        <Card>
          {tasksQuery.isLoading ? (
            <LoadingBlock label="Loading tasks…" />
          ) : view === 'board' ? (
            <Suspense fallback={<LoadingBlock label="Loading board…" />}>
              <TaskBoard tasks={tasks} {...boardProps} />
            </Suspense>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<IconTasks width={24} height={24} />}
              title={search ? 'No matching tasks' : filter === 'all' ? 'No tasks yet' : 'Nothing in this lane'}
              description={
                search
                  ? 'Try a different search term or clear the filters.'
                  : isAdmin
                    ? 'Create your first task to start tracking work.'
                    : 'No open tasks to claim right now. Check back soon.'
              }
              action={
                isAdmin ? (
                  <Button variant="primary" size="sm" icon={<IconPlus width={16} height={16} />} onClick={() => setCreating(true)}>
                    New task
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  busy={busyId === String(task.id)}
                  isAdmin={Boolean(isAdmin)}
                  currentUserId={user?.id}
                  members={members}
                  assigning={usersQuery.isLoading}
                  onToggleStatus={handleToggle}
                  onClaim={handleClaim}
                  onAssign={handleAssign}
                  onOpenActivity={setActivity}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}

          {meta && meta.total > 0 ? (
            <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPageChange={setPage} />
          ) : null}
        </Card>
      )}

      <TaskFormModal open={creating} onClose={() => setCreating(false)} />
      <TaskFormModal open={Boolean(editing)} task={editing} onClose={() => setEditing(null)} />
      <TaskActivityModal task={activity} open={Boolean(activity)} onClose={() => setActivity(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete task"
        message={
          <>
            Delete <strong className="strong">{deleting?.title}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleteTask.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
