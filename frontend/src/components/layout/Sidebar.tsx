import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useUnreadCount } from '../../hooks/useNotifications'
import { cn } from '../../lib/cn'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { IconLogout, Logo } from '../icons'
import { NAV_ITEMS } from './nav-config'

export interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const unread = useUnreadCount(Boolean(user))

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin')
  const unreadTotal = unread.data ?? 0

  return (
    <aside className={cn('sidebar', open && 'sidebar--open')}>
      <div className="brand">
        <span className="brand__mark">
          <Logo width={20} height={20} />
        </span>
        <span>
          <span className="brand__name">Nova</span>
          <span className="brand__tag">Task Workspace</span>
        </span>
      </div>

      <nav className="nav" aria-label="Primary">
        <span className="nav__label">Workspace</span>
        {items.map((item) => {
          const Icon = item.icon
          const withBadge = item.to === '/notifications' && unreadTotal > 0
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => cn('nav-item', isActive && 'nav-item--active')}
            >
              <Icon width={19} height={19} />
              <span>{item.label}</span>
              {withBadge ? (
                <span className="nav-item__badge">{unreadTotal > 99 ? '99+' : unreadTotal}</span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar-user">
          <Avatar name={user?.name ?? '?'} src={user?.image} size="sm" />
          <div className="sidebar-user__meta">
            <div className="sidebar-user__name truncate">{user?.name}</div>
            <div className="sidebar-user__role">
              {user?.role === 'admin' ? 'Administrator' : 'Member'}
            </div>
          </div>
        </div>
        <Button
          variant="subtle"
          block
          icon={<IconLogout width={18} height={18} />}
          onClick={() => void logout()}
        >
          Sign out
        </Button>
      </div>
    </aside>
  )
}
