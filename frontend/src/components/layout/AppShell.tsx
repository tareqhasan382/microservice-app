import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useRealtime } from '../../hooks/useRealtime'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Keep notifications, unread badge and tasks live while the app is open.
  useRealtime()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen ? (
        <div
          className="sidebar-scrim"
          role="presentation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="main">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
