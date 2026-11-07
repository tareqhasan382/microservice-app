import { useState } from 'react'
import { NotificationRow } from '../components/notifications/NotificationRow'
import { IconBell, IconCheck, IconInbox } from '../components/icons'
import { Banner, Button, Card, EmptyState, LoadingBlock, Pagination } from '../components/ui'
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../hooks/useNotifications'
import { getErrorMessage } from '../lib/errors'
import type { Notification } from '../types'

const PAGE_SIZE = 10

type ReadFilter = 'all' | 'unread'

const FILTERS: Array<{ value: ReadFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
]

export function NotificationsPage() {
  const [filter, setFilter] = useState<ReadFilter>('all')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const notificationsQuery = useNotifications({
    page,
    limit: PAGE_SIZE,
    unread: filter === 'unread' ? true : undefined,
  })
  const unread = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const removeNotification = useDeleteNotification()

  const data = notificationsQuery.data
  const notifications = data?.notifications ?? []
  const meta = data?.meta
  const unreadTotal = unread.data ?? 0

  const changeFilter = (next: ReadFilter) => {
    setFilter(next)
    setPage(1)
  }

  const handleMarkRead = async (notification: Notification) => {
    setError(null)
    setBusyId(String(notification.id))
    try {
      await markRead.mutateAsync(notification.id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (notification: Notification) => {
    setError(null)
    setBusyId(String(notification.id))
    try {
      await removeNotification.mutateAsync(notification.id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleMarkAll = async () => {
    setError(null)
    try {
      await markAllRead.mutateAsync()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="pill-toggle" role="group" aria-label="Filter notifications">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="pill-toggle__option"
              aria-pressed={filter === option.value}
              onClick={() => changeFilter(option.value)}
            >
              {option.label}
              {option.value === 'unread' && unreadTotal > 0 ? ` (${unreadTotal})` : ''}
            </button>
          ))}
        </div>
        <span className="toolbar__spacer" />
        <Button
          variant="ghost"
          icon={<IconCheck width={16} height={16} />}
          disabled={unreadTotal === 0}
          loading={markAllRead.isPending}
          onClick={handleMarkAll}
        >
          Mark all read
        </Button>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}

      {notificationsQuery.isError ? (
        <Card>
          <Banner tone="error">
            We could not load your notifications. The API gateway might be offline.
          </Banner>
        </Card>
      ) : (
        <Card>
          {notificationsQuery.isLoading ? (
            <LoadingBlock label="Loading notifications…" />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={filter === 'unread' ? <IconInbox width={24} height={24} /> : <IconBell width={24} height={24} />}
              title={filter === 'unread' ? 'Inbox zero' : 'No notifications yet'}
              description="Activity from your tasks and account will surface here."
            />
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  busy={busyId === String(notification.id)}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {meta && meta.total > 0 ? (
            <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPageChange={setPage} />
          ) : null}
        </Card>
      )}
    </div>
  )
}
