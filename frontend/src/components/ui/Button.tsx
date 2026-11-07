import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  block?: boolean
  iconOnly?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  block = false,
  iconOnly = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'btn',
        `btn--${variant}`,
        size !== 'md' && `btn--${size}`,
        iconOnly && 'btn--icon',
        block && 'btn--block',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner className={variant === 'primary' ? 'spinner--btn' : undefined} /> : icon}
      {!iconOnly && children}
    </button>
  )
}
