import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty__icon">{icon}</span>
      <div className="empty__title">{title}</div>
      {description ? <p className="empty__text">{description}</p> : null}
      {action}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading…', children }: { label?: string; children?: ReactNode }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
      <div className="loading-skeleton" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div className="loading-skeleton__row" key={item}>
            <span className="skeleton loading-skeleton__avatar" />
            <span className="loading-skeleton__copy">
              <span className="skeleton loading-skeleton__line loading-skeleton__line--primary" />
              <span className="skeleton loading-skeleton__line loading-skeleton__line--secondary" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  return <div className={`banner banner--${tone}`}>{children}</div>
}
