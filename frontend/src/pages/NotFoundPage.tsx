import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/icons'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="notfound">
      <span className="brand__mark">
        <Logo width={22} height={22} />
      </span>
      <span className="eyebrow">Error 404</span>
      <h1 className="notfound__title">
        This page <span className="gradient-text">wandered off</span>.
      </h1>
      <p className="muted notfound__text">
        The route you requested does not exist. Head back to the workspace and pick up where you
        left off.
      </p>
      <div className="notfound__actions">
        <Button
          variant="primary"
          onClick={() => navigate('/')}
        >
          Back to home
        </Button>
        {isAuthenticated ? (
          <Link className="btn btn--ghost" to="/tasks">
            Open board
          </Link>
        ) : (
          <Link className="btn btn--ghost" to="/login">
            Sign in
          </Link>
        )}
      </div>
    </div>
  )
}
