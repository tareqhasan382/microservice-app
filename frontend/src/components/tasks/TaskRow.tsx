import { cn } from '../../lib/cn'
import { formatDate, formatDateTime } from '../../lib/format'
import type { Task, User } from '../../types'
import { IconCheck, IconEdit, IconMessage, IconTrash, IconUserPlus } from '../icons'
import { Button } from '../ui/Button'
import { TaskStatusBadge } from '../ui/Badge'
import { AssigneePicker } from './AssigneePicker'

export interface TaskRowProps {
  task: Task
  busy?: boolean
  isAdmin: boolean
  currentUserId?: number
  members: User[]
  assigning?: boolean
  onToggleStatus: (task: Task) => void
  onClaim: (task: Task) => void
  onAssign: (task: Task, assigneeId: number | null) => void
  onOpenActivity: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskRow({
  task,
  busy,
  isAdmin,
  currentUserId,
  members,
  assigning,
  onToggleStatus,
  onClaim,
  onAssign,
  onOpenActivity,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const done = task.status === 'done'
  const canWork = isAdmin || task.assignee_id === currentUserId
  const isOpenForClaim = task.assignee_id === null
  const isClaimable = !isAdmin && isOpenForClaim
  const unreadComments = task.unread_comment_count ?? 0

  return (
    <div className={cn('row-item', isClaimable && 'row-item--claimable')}>
      {canWork ? (
        <button
          type="button"
          className={cn('check-toggle', done && 'check-toggle--done')}
          onClick={() => onToggleStatus(task)}
          disabled={busy}
          aria-pressed={done}
          aria-label={done ? 'Mark as pending' : 'Mark as done'}
        >
          <IconCheck width={15} height={15} />
        </button>
      ) : (
        <span className="task-row__open-mark" aria-hidden="true" />
      )}

      <div className="row-item__body">
        <div className="row-item__title">
          <span className={cn('truncate', done && 'muted strike')}>{task.title}</span>
        </div>
        {task.description ? <p className="row-item__text">{task.description}</p> : null}
        <div className="row-item__meta">
          <TaskStatusBadge status={task.status} />
          <span>·</span>
          <span>
            {isOpenForClaim ? (
              <span className="task-assignee task-assignee--open">Open for claim</span>
            ) : (
              <span className="task-assignee">
                Assigned to <strong className="strong">{task.assignee_name ?? `Member #${task.assignee_id}`}</strong>
              </span>
            )}
          </span>
          <span>·</span>
          <span>Created {formatDate(task.created_at)}</span>
          <span>·</span>
          <span>{formatMinutes(task.total_minutes)} logged</span>
          <span>·</span>
          <span title={formatDateTime(task.created_at)} className="mono">#{task.id}</span>
        </div>
      </div>

      <div className="row-item__actions task-row__actions">
        {isAdmin ? (
          <AssigneePicker
            className="task-row__assign"
            members={members}
            value={task.assignee_id}
            disabled={busy}
            loading={assigning}
            align="end"
            ariaLabel={`Assign ${task.title}`}
            onChange={(assigneeId) => onAssign(task, assigneeId)}
          />
        ) : isClaimable ? (
          <Button
            variant="primary"
            size="sm"
            icon={<IconUserPlus width={15} height={15} />}
            onClick={() => onClaim(task)}
            loading={busy}
          >
            Claim
          </Button>
        ) : null}

        {canWork ? (
          <span className="comment-indicator">
            <Button
              variant="subtle"
              size="sm"
              icon={<IconMessage width={15} height={15} />}
              onClick={() => onOpenActivity(task)}
            >
              Activity
            </Button>
            {unreadComments > 0 ? (
              <span className="comment-badge" title={`${unreadComments} new comment${unreadComments > 1 ? 's' : ''}`}>
                {unreadComments > 9 ? '9+' : unreadComments}
              </span>
            ) : null}
          </span>
        ) : null}

        {isAdmin ? (
          <>
            <Button
              variant="subtle"
              size="sm"
              iconOnly
              icon={<IconEdit width={16} height={16} />}
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.title}`}
            />
            <Button
              variant="subtle"
              size="sm"
              iconOnly
              icon={<IconTrash width={16} height={16} />}
              onClick={() => onDelete(task)}
              aria-label={`Delete ${task.title}`}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes}m`
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}
