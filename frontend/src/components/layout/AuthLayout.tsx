import type { ReactNode } from 'react'
import { IconBell, IconShield, IconTasks, Logo } from '../icons'

/** Split-screen frame shared by the login and register screens. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__form-side">
        <div className="auth__card">
          <div className="brand">
            <span className="brand__mark">
              <Logo width={20} height={20} />
            </span>
            <span>
              <span className="brand__name">Nova</span>
              <span className="brand__tag">Task Workspace</span>
            </span>
          </div>
          {children}
        </div>
      </div>

      <aside className="auth__art">
        <div className="auth__art-grid" aria-hidden="true" />
        <div className="auth__art-body">
          <p className="auth__quote">
            Run every task, notification and teammate from one refined workspace.
          </p>
          <div className="stack stack--sm">
            <div className="auth__feature">
              <span className="auth__feature-icon">
                <IconTasks width={17} height={17} />
              </span>
              Per-user boards with admin oversight
            </div>
            <div className="auth__feature">
              <span className="auth__feature-icon">
                <IconBell width={17} height={17} />
              </span>
              Live notifications over RabbitMQ
            </div>
            <div className="auth__feature">
              <span className="auth__feature-icon">
                <IconShield width={17} height={17} />
              </span>
              JWT sessions with role-based access
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
