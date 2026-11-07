import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Logo } from '../icons'

function BootScreen() {
  return (
    <div className="boot" role="status" aria-live="polite">
      <span className="brand__mark">
        <Logo width={22} height={22} />
      </span>
      <span className="sr-only">Restoring your session…</span>
      <div className="boot__skeleton" aria-hidden="true">
        <span className="skeleton boot__skeleton-line boot__skeleton-line--title" />
        <span className="skeleton boot__skeleton-line" />
        <span className="skeleton boot__skeleton-line boot__skeleton-line--short" />
      </div>
    </div>
  )
}

/** Requires an authenticated user; sends anonymous visitors to /login. */
export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <BootScreen />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Keeps signed-in users away from /login and /register. */
export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return <BootScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Nested inside ProtectedRoute — restricts a subtree to admins. */
export function AdminRoute() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
