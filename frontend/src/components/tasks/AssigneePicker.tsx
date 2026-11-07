import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import type { User } from '../../types'
import { IconChevronDown, IconSearch, IconUser } from '../icons'
import { Avatar } from '../ui/Avatar'

export interface AssigneePickerProps {
  members: User[]
  value: number | null
  onChange: (assigneeId: number | null) => void
  disabled?: boolean
  loading?: boolean
  className?: string
  ariaLabel?: string
  align?: 'start' | 'end'
}

/**
 * Searchable member selector for task assignment.
 * Admins use it to find a member quickly instead of scrolling a long list.
 */
export function AssigneePicker({
  members,
  value,
  onChange,
  disabled,
  loading,
  className,
  ariaLabel = 'Assign task',
  align = 'start',
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const selected = value === null ? null : members.find((member) => member.id === value) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(q) || member.email.toLowerCase().includes(q),
    )
  }, [members, query])

  const pick = (assigneeId: number | null) => {
    onChange(assigneeId)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('assignee-picker', className)}>
      <button
        type="button"
        className="assignee-picker__trigger"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {selected ? (
          <Avatar name={selected.name} src={selected.image} size="sm" />
        ) : (
          <span className="assignee-picker__avatar assignee-picker__avatar--empty" aria-hidden="true">
            <IconUser width={14} height={14} />
          </span>
        )}
        <span className="assignee-picker__label">
          {loading ? 'Loading…' : selected ? selected.name : 'Unassigned'}
        </span>
        <IconChevronDown width={15} height={15} className="assignee-picker__caret" />
      </button>

      {open ? (
        <div className={cn('assignee-picker__menu', align === 'end' && 'assignee-picker__menu--end')}>
          <div className="assignee-picker__search">
            <IconSearch width={15} height={15} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members…"
              aria-label="Search members"
              autoFocus
            />
          </div>
          <ul className="assignee-picker__list" role="listbox" aria-label="Members">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={value === null}
                className={cn(
                  'assignee-picker__option',
                  value === null && 'assignee-picker__option--active',
                )}
                onClick={() => pick(null)}
              >
                <span className="assignee-picker__avatar assignee-picker__avatar--empty" aria-hidden="true">
                  <IconUser width={14} height={14} />
                </span>
                <span className="assignee-picker__option-text">
                  <span className="assignee-picker__option-name">Unassigned</span>
                  <span className="assignee-picker__option-mail">Open for any member to claim</span>
                </span>
              </button>
            </li>
            {filtered.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === member.id}
                  className={cn(
                    'assignee-picker__option',
                    value === member.id && 'assignee-picker__option--active',
                  )}
                  onClick={() => pick(member.id)}
                >
                  <Avatar name={member.name} src={member.image} size="sm" />
                  <span className="assignee-picker__option-text">
                    <span className="assignee-picker__option-name">{member.name}</span>
                    <span className="assignee-picker__option-mail">{member.email}</span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="assignee-picker__empty">No members match “{query.trim()}”.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
