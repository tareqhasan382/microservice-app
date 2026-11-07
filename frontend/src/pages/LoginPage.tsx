import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { IconEye, IconEyeOff, IconLock, IconMail } from '../components/icons'
import { Banner, Button, Field, Input } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../lib/errors'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth__head">
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in</h1>
        <p className="muted">Use your workspace credentials to continue.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        {error ? <Banner tone="error">{error}</Banner> : null}

        <Field label="Email" htmlFor="login-email">
          <div className="input-affix">
            <span className="input-affix__icon">
              <IconMail width={17} height={17} />
            </span>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="login-password">
          <div className="input-affix">
            <span className="input-affix__icon">
              <IconLock width={17} height={17} />
            </span>
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="input-affix__action"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <IconEyeOff width={17} height={17} /> : <IconEye width={17} height={17} />}
            </button>
          </div>
        </Field>

        <Button type="submit" variant="primary" size="lg" block loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="auth__links">
        <span className="muted">New to Nova?</span>
        <Link to="/register">Create an account</Link>
      </div>

      <div className="banner banner--info">
        <span>
          Demo account — <span className="mono">admin@example.com</span> /{' '}
          <span className="mono">Passw0rd!</span>
        </span>
      </div>
    </AuthLayout>
  )
}
