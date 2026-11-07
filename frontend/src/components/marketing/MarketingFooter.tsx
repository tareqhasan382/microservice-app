import { Link } from 'react-router-dom'
import { Logo } from '../icons'

const STACK = ['React 19', 'Node.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'JWT']
const YEAR = new Date().getFullYear()

export function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container mkt-footer__inner">
        <div className="mkt-footer__brand">
          <span className="brand">
            <span className="brand__mark">
              <Logo width={18} height={18} />
            </span>
            <span>
              <span className="brand__name">Nova</span>
              <span className="brand__tag">Task Workspace</span>
            </span>
          </span>
          <p className="muted mkt-footer__note">
            A premium task workspace running on an event-driven microservices core.
          </p>
        </div>

        <div className="mkt-footer__cols">
          <div className="mkt-footer__col">
            <span className="eyebrow">Product</span>
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <a href="#workflow">Workflow</a>
          </div>
          <div className="mkt-footer__col">
            <span className="eyebrow">Account</span>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="mkt-footer__col">
            <span className="eyebrow">Built with</span>
            <span className="mkt-footer__stack">{STACK.join(' · ')}</span>
          </div>
        </div>
      </div>

      <div className="mkt-container mkt-footer__base">
        <span>© {YEAR} Nova Task Workspace</span>
        <span className="mono">v1.0 · microservices edition</span>
      </div>
    </footer>
  )
}
