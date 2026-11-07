import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return <input className={cn('input', invalid && 'input--invalid', className)} {...rest} />
}
