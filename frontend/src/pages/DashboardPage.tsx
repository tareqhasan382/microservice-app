import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import {
  IconArrowRight,
  IconBell,
  IconCheckCircle,
  IconClock,
  IconInbox,
  IconPlus,
  IconTasks,
} from '../components/icons'
import { Card, CardHead, EmptyState, LoadingBlock } from '../components/ui'
import { TaskStatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useNotifications, useUnreadCount } from '../hooks/useNotifications'
import { useTasks } from '../hooks/useTasks'
import { formatRelative } from '../lib/format'
import type { Task } from '../types'

const RECENT_LIMIT = 5

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function firstName(name: string | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? 'there'
}

export function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [creating, setCreating] = useState(false)

  const tasksQuery = useTasks({ page: 1, limit: 100 })
  const notificationsQuery = useNotifications({ page: 1, limit: RECENT_LIMIT })
  const unread = useUnreadCount()

  const tasks = tasksQuery.data?.tasks ?? []
  const total = tasksQuery.data?.meta.total ?? 0
  const done = tasks.filter((task) => task.status === 'done').length
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length
  const pending = tasks.filter((task) => task.status === 'pending').length
  const completion = total > 0 ? Math.round((done / total) * 100) : 0

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, RECENT_LIMIT)

  const notifications = notificationsQuery.data?.notifications ?? []
  const unreadTotal = unread.data ?? 0

  return (
    <div className="stack">
      <Card className="dash-hero animate-rise">
        <span className="dash-hero__glow" aria-hidden="true" />
        <span className="dash-hero__glow dash-hero__glow--aqua" aria-hidden="true" />

        <div className="dash-hero__head">
          <span className="eyebrow">{greeting()}</span>
          <div className="dash-hero__title">
            {firstName(user?.name)}, here is your{' '}
            <span className="gradient-text">workspace pulse</span>.
          </div>
          <p className="muted">
            {total === 0
              ? 'You have no tasks yet — create your first one to get moving.'
              : `${done} of ${total} tasks complete. Keep the momentum going.`}
          </p>
        </div>

        <div className="dash-hero__progress">
          <div className="progress-meta">
            <span className="muted">Completion</span>
            <span className="strong mono">{completion}%</span>
          </div>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <div className="dash-hero__actions">
          {isAdmin ? (
            <Button variant="primary" icon={<IconPlus width={17} height={17} />} onClick={() => setCreating(true)}>
              New task
            </Button>
          ) : null}
          <Link className="btn btn--ghost" to="/tasks">
            Open board
            <IconArrowRight width={16} height={16} />
          </Link>
        </div>
      </Card>

      <div className="grid grid--stats">
        <Card className="stat stat--brand">
          <div className="stat__top">
            <span className="stat__label">Total tasks</span>
            <span className="stat__icon">
              <IconTasks width={19} height={19} />
            </span>
          </div>
          <span className="stat__value">{total}</span>
        </Card>

        <Card className="stat stat--amber">
          <div className="stat__top">
            <span className="stat__label">In progress</span>
            <span className="stat__icon">
              <IconClock width={19} height={19} />
            </span>
          </div>
          <span className="stat__value">{inProgress}</span>
        </Card>

        <Card className="stat stat--aqua">
          <div className="stat__top">
            <span className="stat__label">Completed</span>
            <span className="stat__icon">
              <IconCheckCircle width={19} height={19} />
            </span>
          </div>
          <span className="stat__value">{done}</span>
        </Card>

        <Card className="stat stat--rose">
          <div className="stat__top">
            <span className="stat__label">Unread alerts</span>
            <span className="stat__icon">
              <IconBell width={19} height={19} />
            </span>
          </div>
          <span className="stat__value">{unreadTotal}</span>
        </Card>
      </div>

      <div className="grid grid--two">
        <Card>
          <CardHead
            title="Recent tasks"
            subtitle={pending > 0 ? `${pending} still pending` : 'Everything is moving'}
            action={
              <Link className="ghost-link" to="/tasks">
                View all
                <IconArrowRight width={15} height={15} />
              </Link>
            }
          />
          {tasksQuery.isLoading ? (
            <LoadingBlock label="Loading tasks…" />
          ) : recentTasks.length === 0 ? (
            <EmptyState
              icon={<IconTasks width={24} height={24} />}
              title="No tasks yet"
              description="Create your first task and it will show up here."
              action={
                isAdmin ? (
                  <Button variant="primary" size="sm" icon={<IconPlus width={16} height={16} />} onClick={() => setCreating(true)}>
                    Create task
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div>
              {recentTasks.map((task) => (
                <RecentTaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHead
            title="Notifications"
            subtitle={unreadTotal > 0 ? `${unreadTotal} unread` : 'You are all caught up'}
            action={
              <Link className="ghost-link" to="/notifications">
                View all
                <IconArrowRight width={15} height={15} />
              </Link>
            }
          />
          {notificationsQuery.isLoading ? (
            <LoadingBlock label="Loading notifications…" />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<IconInbox width={24} height={24} />}
              title="Inbox zero"
              description="New alerts from the workspace will land here."
            />
          ) : (
            <div>
              {notifications.map((notification) => (
                <div className="row-item" key={notification.id}>
                  <span
                    className={notification.is_read ? 'unread-dot unread-dot--hidden' : 'unread-dot'}
                    aria-hidden="true"
                  />
                  <div className="row-item__body">
                    <p className="notice__message">{notification.message}</p>
                    <div className="row-item__meta">
                      <span>{formatRelative(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <TaskFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function RecentTaskRow({ task }: { task: Task }) {
  return (
    <Link className="row-item row-item--link" to="/tasks">
      <span className="row-item__body">
        <span className="row-item__title">
          <span className={task.status === 'done' ? 'truncate muted strike' : 'truncate'}>
            {task.title}
          </span>
        </span>
        <span className="row-item__meta">
          <TaskStatusBadge status={task.status} />
          <span>·</span>
          <span>{formatRelative(task.created_at)}</span>
        </span>
      </span>
      <span className="row-item__chevron">
        <IconArrowRight width={16} height={16} />
      </span>
    </Link>
  )
}
