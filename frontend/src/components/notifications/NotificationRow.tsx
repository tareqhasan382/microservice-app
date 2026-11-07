import { cn } from '../../lib/cn'
import { formatRelative } from '../../lib/format'
import type { Notification } from '../../types'
import { IconCheck, IconTrash } from '../icons'
import { Button } from '../ui/Button'

export interface NotificationRowProps {
  notification: Notification
  busy?: boolean
  onMarkRead: (notification: Notification) => void
  onDelete: (notification: Notification) => void
}

export function NotificationRow({ notification, busy, onMarkRead, onDelete }: NotificationRowProps) {
  const unread = !notification.is_read

  return (
    <div className={cn('row-item', unread && 'row-item--unread')}>
      <span className={cn('unread-dot', !unread && 'unread-dot--hidden')} aria-hidden="true" />

      <div className="row-item__body">
        <p className="notice__message">{notification.message}</p>
        <div className="row-item__meta">
          <span>{formatRelative(notification.created_at)}</span>
          <span>·</span>
          <span className="mono">#{notification.id}</span>
          {unread ? (
            <>
              <span>·</span>
              <span className="strong">Unread</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="row-item__actions">
        {unread ? (
          <Button
            variant="subtle"
            size="sm"
            iconOnly
            icon={<IconCheck width={16} height={16} />}
            onClick={() => onMarkRead(notification)}
            disabled={busy}
            aria-label="Mark as read"
          />
        ) : null}
        <Button
          variant="subtle"
          size="sm"
          iconOnly
          icon={<IconTrash width={16} height={16} />}
          onClick={() => onDelete(notification)}
          disabled={busy}
          aria-label="Delete notification"
        />
      </div>
    </div>
  )
}
