import { cn } from '../../lib/cn'

export interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('spinner', size === 'lg' && 'spinner--lg', className)}
    />
  )
}
