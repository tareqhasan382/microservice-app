import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { IconArrowRight, Logo } from '../icons'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#workflow', label: 'Workflow' },
]

/** Sticky, glassy top bar for the public landing page. */
export function MarketingNav() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="mkt-nav">
      <div className="mkt-container mkt-nav__inner">
        <Link className="brand mkt-nav__brand" to="/">
          <span className="brand__mark">
            <Logo width={20} height={20} />
          </span>
          <span>
            <span className="brand__name">Nova</span>
            <span className="brand__tag">Task Workspace</span>
          </span>
        </Link>

        <nav className="mkt-nav__links" aria-label="Landing">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mkt-nav__actions">
          {isAuthenticated ? (
            <Link className="btn btn--primary btn--sm" to="/dashboard">
              Open dashboard
              <IconArrowRight width={15} height={15} />
            </Link>
          ) : (
            <>
              <Link className="btn btn--subtle btn--sm" to="/login">
                Sign in
              </Link>
              <Link className="btn btn--primary btn--sm" to="/register">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
