import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { IconMenu } from '../icons'
import { findNavItem } from './nav-config'

export interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const item = findNavItem(location.pathname)
  const { user } = useAuth()

  return (
    <header className="topbar">
      <div className="topbar__title">
        <h1>{item?.title ?? 'Nova'}</h1>
        {item?.subtitle ? <span>{item.subtitle}</span> : null}
      </div>
      <div className="topbar__actions">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className="topbar__menu"
          icon={<IconMenu width={18} height={18} />}
          onClick={onMenuClick}
          aria-label="Open navigation"
        />
        <Avatar name={user?.name ?? '?'} src={user?.image} size="sm" ring />
      </div>
    </header>
  )
}
