import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getErrorMessage } from '../../lib/errors'
import { formatDateTime, formatRelative } from '../../lib/format'
import {
  useAddTaskComment,
  useAddTaskTimeEntry,
  useMarkCommentsRead,
  useTaskAssignmentHistory,
  useTaskComments,
  useTaskTimeEntries,
} from '../../hooks/useTasks'
import type { Task, TaskAssignmentEvent } from '../../types'
import { cn } from '../../lib/cn'
import { IconClock, IconHistory, IconMessage, IconSend } from '../icons'
import { Avatar } from '../ui/Avatar'
import { Banner, Button, EmptyState, Field, Input, LoadingBlock, Pagination, Textarea } from '../ui'
import { Modal } from '../ui/Modal'

export interface TaskActivityModalProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

type ActivityTab = 'feedback' | 'time' | 'history'

const TABS: Array<{ id: ActivityTab; label: string; icon: ReactNode }> = [
  { id: 'feedback', label: 'Feedback', icon: <IconMessage width={15} height={15} /> },
  { id: 'time', label: 'Time', icon: <IconClock width={15} height={15} /> },
  { id: 'history', label: 'Assignments', icon: <IconHistory width={15} height={15} /> },
]

const taskRef = (task: Task | null) => task?.id ?? 0

export function TaskActivityModal({ task, open, onClose }: TaskActivityModalProps) {
  const [tab, setTab] = useState<ActivityTab>('feedback')
  const [commentsPage, setCommentsPage] = useState(1)
  const [timePage, setTimePage] = useState(1)
  const id = taskRef(task)

  useEffect(() => {
    if (!open) return
    setTab('feedback')
    setCommentsPage(1)
    setTimePage(1)
  }, [open, id])

  const commentsQuery = useTaskComments(id, open && tab === 'feedback', commentsPage)
  const timeQuery = useTaskTimeEntries(id, open && tab === 'time', timePage)
  const historyQuery = useTaskAssignmentHistory(id, open && tab === 'history')

  // Clear the task's unread-comment badge once the feedback thread is shown.
  const { mutate: markCommentsRead } = useMarkCommentsRead(id)
  const markedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!open) {
      markedRef.current = null
      return
    }
    if (tab !== 'feedback' || !commentsQuery.isSuccess) return
    if (markedRef.current === id) return
    markedRef.current = id
    markCommentsRead()
  }, [open, id, tab, commentsQuery.isSuccess, markCommentsRead])

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={task ? task.title : 'Task activity'}
      subtitle={task ? `Task #${task.id} · activity, feedback & effort` : undefined}
    >
      <div className="task-activity">
        <div className="tabs" role="tablist" aria-label="Task activity sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={cn('tab', tab === item.id && 'tab--active')}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'feedback' ? (
          <FeedbackTab taskId={id} query={commentsQuery} page={commentsPage} onPage={setCommentsPage} />
        ) : null}
        {tab === 'time' ? (
          <TimeTab taskId={id} query={timeQuery} page={timePage} onPage={setTimePage} />
        ) : null}
        {tab === 'history' ? <HistoryTab query={historyQuery} /> : null}
      </div>
    </Modal>
  )
}

/* --- Feedback (discussion thread) ---------------------- */

interface FeedbackTabProps {
  taskId: number
  query: ReturnType<typeof useTaskComments>
  page: number
  onPage: (page: number) => void
}

function FeedbackTab({ taskId, query, page, onPage }: FeedbackTabProps) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const addComment = useAddTaskComment(taskId)

  const submit = async () => {
    const value = body.trim()
    if (!value) return
    setError(null)
    try {
      await addComment.mutateAsync(value)
      setBody('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const comments = query.data?.comments ?? []
  const meta = query.data?.meta

  return (
    <div className="activity-panel">
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="comment-composer">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share an update, ask a question, or leave feedback…"
          rows={3}
          maxLength={5000}
          aria-label="New comment"
        />
        <div className="comment-composer__foot">
          <span className="muted comment-composer__hint">{body.trim().length}/5000</span>
          <Button
            variant="primary"
            size="sm"
            icon={<IconSend width={15} height={15} />}
            loading={addComment.isPending}
            disabled={!body.trim()}
            onClick={submit}
          >
            Post feedback
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <LoadingBlock label="Loading feedback…" />
      ) : comments.length === 0 ? (
        <EmptyState
          icon={<IconMessage width={22} height={22} />}
          title="No feedback yet"
          description="Be the first to comment on this task."
        />
      ) : (
        <ul className="comment-thread">
          {comments.map((comment) => (
            <li className="comment" key={comment.id}>
              <Avatar name={comment.author_name} size="sm" />
              <div className="comment__body">
                <div className="comment__head">
                  <span className="comment__author">{comment.author_name}</span>
                  <span className="comment__time" title={formatDateTime(comment.created_at)}>
                    {formatRelative(comment.created_at)}
                  </span>
                </div>
                <p className="comment__text">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.total > meta.limit ? (
        <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPageChange={onPage} />
      ) : null}
      {page > 1 && comments.length === 0 && !query.isLoading ? (
        <p className="muted">No more feedback on this page.</p>
      ) : null}
    </div>
  )
}

/* --- Time tracking ------------------------------------- */

interface TimeTabProps {
  taskId: number
  query: ReturnType<typeof useTaskTimeEntries>
  page: number
  onPage: (page: number) => void
}

function TimeTab({ taskId, query, page, onPage }: TimeTabProps) {
  const [minutes, setMinutes] = useState('30')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const addTime = useAddTaskTimeEntry(taskId)

  const submit = async () => {
    const value = Number(minutes)
    if (!Number.isInteger(value) || value < 1 || value > 1440) {
      setError('Enter a duration between 1 and 1440 minutes.')
      return
    }
    setError(null)
    try {
      await addTime.mutateAsync({ minutes: value, note: note.trim() || undefined })
      setNote('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const entries = query.data?.entries ?? []
  const meta = query.data?.meta
  const total = entries.reduce((sum, entry) => sum + entry.minutes, 0)

  return (
    <div className="activity-panel">
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="time-composer">
        <Field label="Minutes" htmlFor="time-minutes">
          <Input
            id="time-minutes"
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </Field>
        <Field label="Note" htmlFor="time-note" hint="Optional">
          <Input
            id="time-note"
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What did you work on?"
          />
        </Field>
        <Button
          variant="primary"
          size="sm"
          icon={<IconClock width={15} height={15} />}
          loading={addTime.isPending}
          onClick={submit}
        >
          Log time
        </Button>
      </div>

      {query.isLoading ? (
        <LoadingBlock label="Loading time entries…" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<IconClock width={22} height={22} />}
          title="No time logged"
          description="Log effort so the team can see where the hours go."
        />
      ) : (
        <>
          <p className="time-summary muted">
            {formatMinutes(total)} logged on this page
            {meta ? ` · ${meta.total} ${meta.total === 1 ? 'entry' : 'entries'} total` : ''}
          </p>
          <ul className="time-list">
            {entries.map((entry) => (
              <li className="time-item" key={entry.id}>
                <Avatar name={entry.user_name} size="sm" />
                <div className="time-item__body">
                  <div className="time-item__head">
                    <span className="time-item__author">{entry.user_name}</span>
                    <span className="time-item__minutes mono">{formatMinutes(entry.minutes)}</span>
                  </div>
                  {entry.note ? <p className="time-item__note">{entry.note}</p> : null}
                  <span className="time-item__time" title={formatDateTime(entry.created_at)}>
                    {formatRelative(entry.created_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {meta && meta.total > meta.limit ? (
        <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPageChange={onPage} />
      ) : null}
      {page > 1 && entries.length === 0 && !query.isLoading ? (
        <p className="muted">No more time entries on this page.</p>
      ) : null}
    </div>
  )
}

/* --- Assignment history -------------------------------- */

const ACTION_LABEL: Record<TaskAssignmentEvent['action'], string> = {
  assigned: 'assigned',
  reassigned: 'reassigned',
  claimed: 'self-assigned',
  unassigned: 'unassigned',
  legacy_migrated: 'imported',
}

function HistoryTab({ query }: { query: ReturnType<typeof useTaskAssignmentHistory> }) {
  if (query.isLoading) return <LoadingBlock label="Loading assignment history…" />
  const events = query.data ?? []
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<IconHistory width={22} height={22} />}
        title="No assignment activity"
        description="Assignment changes will be tracked here with timestamps."
      />
    )
  }

  // API returns newest-first; render chronologically with time-in-state.
  const ordered = [...events].sort((a, b) => a.id - b.id)

  return (
    <ol className="timeline">
      {ordered.map((event, index) => {
        const next = ordered[index + 1]
        const heldLabel = next ? formatDuration(new Date(next.created_at).getTime() - new Date(event.created_at).getTime()) : null
        const target = event.assignee_name
          ? `to ${event.assignee_name}`
          : event.action === 'unassigned'
            ? 'from the task'
            : ''
        return (
          <li className="timeline__item" key={event.id}>
            <span className={cn('timeline__dot', `timeline__dot--${event.action}`)} aria-hidden="true" />
            <div className="timeline__body">
              <p className="timeline__text">
                <strong className="strong">{event.actor_name}</strong>{' '}
                {ACTION_LABEL[event.action]} {target}
              </p>
              <div className="timeline__meta">
                <span title={formatDateTime(event.created_at)}>{formatRelative(event.created_at)}</span>
                {heldLabel ? <span>· held {heldLabel}</span> : null}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* --- helpers ------------------------------------------- */

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes}m`
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

function formatDuration(ms: number): string {
  if (ms < 0) return '—'
  const minutes = Math.round(ms / 60000)
  if (minutes < 1) return 'under a minute'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) return rest ? `${hours}h ${rest}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours ? `${days}d ${restHours}h` : `${days}d`
}
