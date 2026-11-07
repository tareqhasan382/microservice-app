import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { titleCase } from '../../lib/format'
import type { Role, TaskStatus } from '../../types'

export interface BadgeProps {
  children: ReactNode
  tone?: Role | 'danger' | 'unread'
  className?: string
}

export function Badge({ children, tone, className }: BadgeProps) {
  return <span className={cn('badge', tone && `badge--${tone}`, className)}>{children}</span>
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn('badge', `badge--${status}`)}>
      <span className="badge__dot" />
      {titleCase(status)}
    </span>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className={cn('badge', `badge--${role}`)}>{titleCase(role)}</span>
}
