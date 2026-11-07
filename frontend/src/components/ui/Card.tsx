import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  tight?: boolean
}

export function Card({ interactive, tight, className, ...rest }: CardProps) {
  return (
    <div
      className={cn('card', tight ? 'card--tight' : 'card--pad', interactive && 'card--interactive', className)}
      {...rest}
    />
  )
}

export interface CardHeadProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}

export function CardHead({ title, subtitle, action }: CardHeadProps) {
  return (
    <div className="card__head">
      <div>
        <div className="card__title">{title}</div>
        {subtitle ? <div className="card__sub">{subtitle}</div> : null}
      </div>
      {action}
    </div>
  )
}
