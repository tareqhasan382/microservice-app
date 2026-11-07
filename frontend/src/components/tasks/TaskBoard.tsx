import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import { formatDate } from '../../lib/format'
import type { Task, TaskStatus, User } from '../../types'
import { IconEdit, IconGrip, IconMessage, IconTrash, IconUserPlus } from '../icons'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { TaskStatusBadge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { AssigneePicker } from './AssigneePicker'

const LANES: Array<{ status: TaskStatus; title: string; hint: string }> = [
  { status: 'pending', title: 'Pending', hint: 'Ready to be picked up' },
  { status: 'in_progress', title: 'In progress', hint: 'Work in motion' },
  { status: 'done', title: 'Done', hint: 'Shipped and complete' },
]

const laneId = (status: TaskStatus) => `lane:${status}`

const laneCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args)
}

const laneKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  const compactLayout = window.matchMedia('(max-width: 920px)').matches

  if (compactLayout) {
    if (event.code === 'ArrowDown') {
      return { ...currentCoordinates, y: currentCoordinates.y + 220 }
    }
    if (event.code === 'ArrowUp') {
      return { ...currentCoordinates, y: currentCoordinates.y - 220 }
    }
    return
  }

  const laneDistance = Math.min(420, Math.max(300, window.innerWidth / 3))
  if (event.code === 'ArrowRight') {
    return { ...currentCoordinates, x: currentCoordinates.x + laneDistance }
  }
  if (event.code === 'ArrowLeft') {
    return { ...currentCoordinates, x: currentCoordinates.x - laneDistance }
  }
  if (event.code === 'ArrowDown') {
    return { ...currentCoordinates, y: currentCoordinates.y + 30 }
  }
  if (event.code === 'ArrowUp') {
    return { ...currentCoordinates, y: currentCoordinates.y - 30 }
  }
}

export interface TaskBoardProps {
  tasks: Task[]
  updating: boolean
  isAdmin: boolean
  currentUserId?: number
  members: User[]
  onMoveStatus: (task: Task, status: TaskStatus) => void
  onClaim: (task: Task) => void
  onAssign: (task: Task, assigneeId: number | null) => void
  onOpenActivity: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskBoard({
  tasks,
  updating,
  isAdmin,
  currentUserId,
  members,
  onMoveStatus,
  onClaim,
  onAssign,
  onOpenActivity,
  onEdit,
  onDelete,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: laneKeyboardCoordinates }),
  )
  const tasksByStatus = Object.fromEntries(
    LANES.map(({ status }) => [status, tasks.filter((task) => task.status === status)]),
  ) as Record<TaskStatus, Task[]>

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const task = tasks.find((item) => String(item.id) === String(active.id))
    const targetStatus = LANES.find(({ status }) => laneId(status) === over?.id)?.status

    if (task && targetStatus && task.status !== targetStatus) {
      onMoveStatus(task, targetStatus)
    }
    setActiveTask(null)
  }

  return (
    <div className="task-board-wrap">
      <p className="task-board__help">
        {tasks.length === 0
          ? 'No tasks on this page. Create a task (admins) or claim an open one to get started.'
          : 'Drag a card to change its status. Keyboard: focus the grip, press Space, use the arrow keys, then press Space to drop. Each card also has a status menu.'}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={laneCollisionDetection}
        onDragStart={({ active }) => {
          setActiveTask(tasks.find((task) => String(task.id) === String(active.id)) ?? null)
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Press Space to pick up a task, use the arrow keys to move between lanes, and press Space to drop it. Press Escape to cancel.',
          },
        }}
      >
        <div className="task-board" aria-label="Tasks grouped by status">
          {LANES.map((lane) => (
            <TaskLane
              key={lane.status}
              lane={lane}
              tasks={tasksByStatus[lane.status]}
              updating={updating}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              members={members}
              onMoveStatus={onMoveStatus}
              onClaim={onClaim}
              onAssign={onAssign}
              onOpenActivity={onOpenActivity}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCardPreview task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

interface TaskLaneProps extends Omit<TaskBoardProps, 'tasks'> {
  lane: (typeof LANES)[number]
  tasks: Task[]
}

function TaskLane({ lane, tasks, isAdmin, ...rest }: TaskLaneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: laneId(lane.status) })
  const openForClaim = isAdmin ? 0 : tasks.filter((task) => task.assignee_id === null).length

  return (
    <section
      ref={setNodeRef}
      className={`task-lane task-lane--${lane.status}${isOver ? ' task-lane--over' : ''}`}
      aria-labelledby={`task-lane-${lane.status}`}
    >
      <header className="task-lane__head">
        <div>
          <h2 className="task-lane__title" id={`task-lane-${lane.status}`}>
            {lane.title}
          </h2>
          <p className={`task-lane__hint${openForClaim > 0 ? ' task-lane__hint--claim' : ''}`}>
            {openForClaim > 0 ? `${openForClaim} open for you to claim` : lane.hint}
          </p>
        </div>
        <span className="task-lane__count" aria-label={`${tasks.length} tasks`}>
          {tasks.length}
        </span>
      </header>

      <div className="task-lane__cards">
        {tasks.length ? (
          tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} isAdmin={isAdmin} {...rest} />
          ))
        ) : (
          <div className="task-lane__empty">Drop a task here</div>
        )}
      </div>
    </section>
  )
}

interface DraggableTaskCardProps extends Omit<TaskBoardProps, 'tasks'> {
  task: Task
}

function DraggableTaskCard({
  task,
  updating,
  isAdmin,
  currentUserId,
  members,
  onMoveStatus,
  onClaim,
  onAssign,
  onOpenActivity,
  onEdit,
  onDelete,
}: DraggableTaskCardProps) {
  const canWork = isAdmin || task.assignee_id === currentUserId
  const isOpenForClaim = task.assignee_id === null
  const isClaimable = !isAdmin && isOpenForClaim
  const unreadComments = task.unread_comment_count ?? 0
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: String(task.id), disabled: updating || !canWork })

  return (
    <article
      ref={setNodeRef}
      className={`task-card${isClaimable ? ' task-card--claimable' : ''}${isDragging ? ' task-card--dragging' : ''}`}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition: transform ? undefined : 'transform 180ms ease',
      }}
    >
      <div className="task-card__head">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="task-card__grip"
          aria-label={`Move task: ${task.title}`}
          disabled={updating || !canWork}
          {...attributes}
          {...listeners}
        >
          <IconGrip width={17} height={17} />
        </button>
        <TaskStatusBadge status={task.status} />
        <span className="task-card__id">#{task.id}</span>
      </div>

      <h3 className="task-card__title">{task.title}</h3>
      {task.description ? <p className="task-card__description">{task.description}</p> : null}

      <div className="task-card__meta">
        <span>Created {formatDate(task.created_at)}</span>
        {task.total_minutes ? <span>· {formatMinutes(task.total_minutes)} logged</span> : null}
      </div>

      <footer className="task-card__footer">
        <div className="task-card__owner">
          {isAdmin ? (
            <AssigneePicker
              className="task-card__assignee"
              members={members}
              value={task.assignee_id}
              disabled={updating}
              ariaLabel={`Assign ${task.title}`}
              onChange={(assigneeId) => onAssign(task, assigneeId)}
            />
          ) : isClaimable ? (
            <span className="task-open-chip">
              <IconUserPlus width={13} height={13} />
              Open for claim
            </span>
          ) : (
            <span className="task-assignee">
              <Avatar name={task.assignee_name ?? '?'} size="sm" />
              {task.assignee_name ?? `Member #${task.assignee_id}`}
            </span>
          )}
        </div>

        <div className="task-card__controls">
          {isClaimable ? (
            <Button
              variant="primary"
              size="sm"
              block
              icon={<IconUserPlus width={15} height={15} />}
              disabled={updating}
              onClick={() => onClaim(task)}
            >
              Claim this task
            </Button>
          ) : (
            <>
              <Select
                className="task-card__status"
                aria-label={`Change status for ${task.title}`}
                value={task.status}
                disabled={updating || !canWork}
                onChange={(event) => onMoveStatus(task, event.target.value as TaskStatus)}
              >
                {LANES.map(({ status, title }) => (
                  <option key={status} value={status}>
                    {title}
                  </option>
                ))}
              </Select>
              <div className="task-card__actions">
                {canWork ? (
                  <span className="comment-indicator">
                    <Button
                      variant="subtle"
                      size="sm"
                      iconOnly
                      icon={<IconMessage width={15} height={15} />}
                      onClick={() => onOpenActivity(task)}
                      aria-label={`Activity for ${task.title}${unreadComments ? `, ${unreadComments} new` : ''}`}
                    />
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
                      icon={<IconEdit width={15} height={15} />}
                      onClick={() => onEdit(task)}
                      aria-label={`Edit ${task.title}`}
                    />
                    <Button
                      variant="subtle"
                      size="sm"
                      iconOnly
                      icon={<IconTrash width={15} height={15} />}
                      onClick={() => onDelete(task)}
                      aria-label={`Delete ${task.title}`}
                    />
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>
      </footer>
    </article>
  )
}

function TaskCardPreview({ task }: { task: Task }) {
  return (
    <article className="task-card task-card--overlay">
      <div className="task-card__head">
        <IconGrip width={17} height={17} />
        <TaskStatusBadge status={task.status} />
      </div>
      <h3 className="task-card__title">{task.title}</h3>
      {task.description ? <p className="task-card__description">{task.description}</p> : null}
    </article>
  )
}

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes}m`
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}
