import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { IconEye, IconEyeOff, IconLock, IconMail, IconUser } from '../components/icons'
import { Banner, Button, Field, Input } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../lib/errors'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const passwordTooShort = password.length > 0 && password.length < 6
  const mismatch = confirm.length > 0 && confirm !== password

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await register({ name: name.trim(), email: email.trim(), password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth__head">
        <span className="eyebrow">Get started</span>
        <h1>Create your account</h1>
        <p className="muted">A new member account is provisioned with the user role.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        {error ? <Banner tone="error">{error}</Banner> : null}

        <Field label="Full name" htmlFor="register-name">
          <div className="input-affix">
            <span className="input-affix__icon">
              <IconUser width={17} height={17} />
            </span>
            <Input
              id="register-name"
              autoComplete="name"
              required
              placeholder="Alice Carter"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </Field>

        <Field label="Email" htmlFor="register-email">
          <div className="input-affix">
            <span className="input-affix__icon">
              <IconMail width={17} height={17} />
            </span>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </Field>

        <Field
          label="Password"
          htmlFor="register-password"
          hint="Minimum 6 characters"
          error={passwordTooShort ? 'Password must be at least 6 characters.' : undefined}
        >
          <div className="input-affix">
            <span className="input-affix__icon">
              <IconLock width={17} height={17} />
            </span>
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              invalid={passwordTooShort}
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

        <Field
          label="Confirm password"
          htmlFor="register-confirm"
          error={mismatch ? 'Passwords do not match.' : undefined}
        >
          <div className="input-affix">
            <span className="input-affix__icon">
              <IconLock width={17} height={17} />
            </span>
            <Input
              id="register-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              invalid={mismatch}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
        </Field>

        <Button type="submit" variant="primary" size="lg" block loading={submitting}>
          Create account
        </Button>
      </form>

      <div className="auth__links">
        <span className="muted">Already have an account?</span>
        <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  )
}
