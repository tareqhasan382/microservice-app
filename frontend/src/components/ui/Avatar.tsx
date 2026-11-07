import { cn } from '../../lib/cn'
import { initials } from '../../lib/format'

export interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  ring?: boolean
  className?: string
}

export function Avatar({ name, src, size = 'md', ring = false, className }: AvatarProps) {
  return (
    <span
      className={cn('avatar', size !== 'md' && `avatar--${size}`, ring && 'avatar--ring', className)}
      title={name}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  )
}
