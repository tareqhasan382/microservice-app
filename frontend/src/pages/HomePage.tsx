import { Link } from 'react-router-dom'
import { MarketingFooter } from '../components/marketing/MarketingFooter'
import { MarketingNav } from '../components/marketing/MarketingNav'
import {
  IconArrowRight,
  IconBell,
  IconCheck,
  IconLayers,
  IconLock,
  IconShield,
  IconSparkles,
  IconTasks,
  IconUser,
  IconUsers,
} from '../components/icons'
import { useAuth } from '../hooks/useAuth'

const STACK = ['API Gateway', 'User Service', 'Task Service', 'Notifications', 'RabbitMQ', 'JWT + RBAC']

const FEATURES = [
  {
    icon: IconTasks,
    title: 'Per-user boards',
    text: 'Every member gets a private task board with status, progress and history kept in sync.',
  },
  {
    icon: IconUsers,
    title: 'Admin oversight',
    text: 'Administrators can browse the whole directory, reassign roles and manage accounts.',
  },
  {
    icon: IconBell,
    title: 'Live notifications',
    text: 'Task activity raises events that surface as inbox alerts the moment they happen.',
  },
  {
    icon: IconShield,
    title: 'Hardened sessions',
    text: 'Short-lived access tokens with silent refresh keep you signed in without the risk.',
  },
  {
    icon: IconLock,
    title: 'Role-based access',
    text: 'Route guards and API policies separate member and administrator capabilities cleanly.',
  },
  {
    icon: IconSparkles,
    title: 'Instant, optimistic UI',
    text: 'Status changes apply immediately and reconcile with the server in the background.',
  },
]

const SERVICES = [
  { icon: IconLayers, name: 'API Gateway', port: ':5000', note: 'Routing & auth gate' },
  { icon: IconUser, name: 'User Service', port: ':5001', note: 'Identity & roles' },
  { icon: IconTasks, name: 'Task Service', port: ':5002', note: 'Boards & status' },
  { icon: IconBell, name: 'Notification Service', port: ':5003', note: 'Inbox & delivery' },
]

const EVENTS = ['user.registered', 'task.created', 'task.updated', 'task.deleted']

const STEPS = [
  {
    title: 'Create your account',
    text: 'Sign up in seconds and a personal board is provisioned for you automatically.',
  },
  {
    title: 'Plan, then ship',
    text: 'Capture tasks, move them through pending, in progress and done as the work happens.',
  },
  {
    title: 'Stay in the loop',
    text: 'Each change publishes an event that lands in your notification inbox instantly.',
  },
]

export function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="mkt">
      <MarketingNav />

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="mkt-hero">
          <span className="mkt-hero__glow mkt-hero__glow--violet" aria-hidden="true" />
          <span className="mkt-hero__glow mkt-hero__glow--aqua" aria-hidden="true" />

          <div className="mkt-container mkt-hero__inner">
            <div className="mkt-hero__copy">
              <span className="mkt-pill">
                <IconSparkles width={14} height={14} />
                Task management, engineered
              </span>
              <h1 className="mkt-hero__title">
                Every task, teammate and alert in{' '}
                <span className="gradient-text">one refined workspace</span>.
              </h1>
              <p className="mkt-hero__lead">
                Nova pairs a luxurious interface with a real event-driven backend. The moment work
                changes, notifications appear — powered by a microservices core with secure,
                role-aware access.
              </p>
              <div className="mkt-hero__actions">
                {isAuthenticated ? (
                  <Link className="btn btn--primary btn--lg" to="/dashboard">
                    Open dashboard
                    <IconArrowRight width={17} height={17} />
                  </Link>
                ) : (
                  <>
                    <Link className="btn btn--primary btn--lg" to="/register">
                      Get started free
                      <IconArrowRight width={17} height={17} />
                    </Link>
                    <Link className="btn btn--ghost btn--lg" to="/login">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
              <div className="mkt-strip">
                {STACK.map((item) => (
                  <span className="mkt-chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mkt-hero__visual">
              <PreviewPanel />
            </div>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="mkt-section">
          <div className="mkt-container">
            <SectionHead
              eyebrow="Capabilities"
              title="Built for people who care about the details"
              lead="Purpose-built features, not a checklist. Everything below ships in the product and runs against the live services."
            />
            <div className="mkt-features">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <article className="card card--pad mkt-feature" key={feature.title}>
                    <span className="mkt-feature__icon">
                      <Icon width={20} height={20} />
                    </span>
                    <h3>{feature.title}</h3>
                    <p className="muted">{feature.text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------------- Architecture ---------------- */}
        <section id="architecture" className="mkt-section mkt-section--tinted">
          <div className="mkt-container">
            <SectionHead
              eyebrow="Under the hood"
              title="A genuine microservices core"
              lead="Four independent services, one durable message bus. Request traffic is routed through the gateway; state changes travel as events."
            />
            <div className="mkt-arch">
              <div className="mkt-flow">
                {SERVICES.map((service, index) => {
                  const Icon = service.icon
                  return (
                    <div className="mkt-node" key={service.name}>
                      <span className="mkt-node__icon">
                        <Icon width={20} height={20} />
                      </span>
                      <span className="mkt-node__name">{service.name}</span>
                      <span className="mkt-node__port mono">{service.port}</span>
                      <span className="mkt-node__note">{service.note}</span>
                      {index < SERVICES.length - 1 ? (
                        <span className="mkt-node__link" aria-hidden="true">
                          <IconArrowRight width={16} height={16} />
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="mkt-bus">
                <div className="mkt-bus__head">
                  <span className="mkt-bus__badge">
                    <IconCheck width={14} height={14} />
                    Durable topic exchange
                  </span>
                  <span className="mono strong">task_app.events</span>
                </div>
                <div className="mkt-bus__events">
                  {EVENTS.map((event) => (
                    <span className="mkt-event mono" key={event}>
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Workflow ---------------- */}
        <section id="workflow" className="mkt-section">
          <div className="mkt-container">
            <SectionHead
              eyebrow="Workflow"
              title="From sign-up to shipped in three moves"
              lead="No setup rituals. The workspace is ready the moment you are."
            />
            <ol className="mkt-steps">
              {STEPS.map((step, index) => (
                <li className="mkt-step" key={step.title}>
                  <span className="mkt-step__index mono">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p className="muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="mkt-section">
          <div className="mkt-container">
            <div className="mkt-cta">
              <span className="mkt-cta__glow" aria-hidden="true" />
              <div className="mkt-cta__text">
                <span className="eyebrow">Ready when you are</span>
                <h2 className="mkt-cta__title">Start in under a minute</h2>
                <p className="muted">
                  Explore the workspace with the demo administrator, or create your own member
                  account.
                </p>
                <div className="mkt-cta__creds">
                  <span className="mono">admin@example.com</span>
                  <span className="mkt-cta__sep">/</span>
                  <span className="mono">Passw0rd!</span>
                </div>
              </div>
              <div className="mkt-cta__actions">
                {isAuthenticated ? (
                  <Link className="btn btn--primary btn--lg" to="/dashboard">
                    Open dashboard
                    <IconArrowRight width={17} height={17} />
                  </Link>
                ) : (
                  <>
                    <Link className="btn btn--primary btn--lg" to="/register">
                      Create account
                    </Link>
                    <Link className="btn btn--ghost btn--lg" to="/login">
                      Use demo login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

function SectionHead({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <div className="mkt-section__head">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mkt-section__title">{title}</h2>
      <p className="muted mkt-section__lead">{lead}</p>
    </div>
  )
}

function PreviewPanel() {
  const rows = [
    { title: 'Design the notification inbox', status: 'done' as const },
    { title: 'Wire optimistic task updates', status: 'in_progress' as const },
    { title: 'Review API gateway rewrites', status: 'pending' as const },
  ]

  return (
    <div className="mkt-preview">
      <div className="mkt-preview__bar">
        <span className="mkt-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mono mkt-preview__title">nova · dashboard</span>
      </div>

      <div className="mkt-preview__body">
        <div className="mkt-preview__head">
          <div>
            <span className="eyebrow">Completion</span>
            <div className="mkt-preview__stat">68%</div>
          </div>
          <span className="badge badge--done">
            <span className="badge__dot" />
            On track
          </span>
        </div>

        <div className="progress">
          <div className="progress__bar" style={{ width: '68%' }} />
        </div>

        <div className="mkt-preview__rows">
          {rows.map((row) => (
            <div className="mkt-mini-task" key={row.title}>
              <span className={`mkt-mini-task__check mkt-mini-task__check--${row.status}`}>
                {row.status === 'done' ? <IconCheck width={12} height={12} /> : null}
              </span>
              <span className="mkt-mini-task__title truncate">{row.title}</span>
              <span className={`badge badge--${row.status}`}>
                <span className="badge__dot" />
                {row.status === 'in_progress' ? 'In progress' : row.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mkt-toast">
        <span className="mkt-toast__icon">
          <IconBell width={16} height={16} />
        </span>
        <span>
          <span className="strong mkt-toast__title">Task created</span>
          <span className="muted mkt-toast__meta">routed via task_app.events</span>
        </span>
      </div>
    </div>
  )
}
