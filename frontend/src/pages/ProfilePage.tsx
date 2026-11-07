import { useState } from 'react'
import type { FormEvent } from 'react'
import { IconLock, IconShield, IconUser } from '../components/icons'
import { Avatar } from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import { Banner, Button, Card, CardHead, Field, Input } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useChangePassword, useUpdateProfile } from '../hooks/useProfile'
import { getErrorMessage } from '../lib/errors'
import { formatDate } from '../lib/format'

export function ProfilePage() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [name, setName] = useState(user?.name ?? '')
  const [image, setImage] = useState(user?.image ?? '')
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileError(null)
    setProfileMessage(null)
    if (!name.trim()) {
      setProfileError('Your name cannot be empty.')
      return
    }
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        image: image.trim() ? image.trim() : null,
      })
      setProfileMessage('Profile updated successfully.')
    } catch (err) {
      setProfileError(getErrorMessage(err))
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    if (newPassword.length < 6) {
      setPasswordError('The new password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new password and confirmation do not match.')
      return
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      setPasswordMessage('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(getErrorMessage(err))
    }
  }

  return (
    <div className="stack">
      <Card className="animate-rise">
        <div className="profile-identity">
          <Avatar name={user?.name ?? '?'} src={user?.image} size="lg" ring />
          <div className="profile-identity__text">
            <div className="profile-identity__name">{user?.name}</div>
            <div className="muted">{user?.email}</div>
            <div className="profile-identity__tags">
              {user?.role ? <RoleBadge role={user.role} /> : null}
              <span className="badge badge--user">Since {formatDate(user?.created_at)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid--two">
        <Card>
          <CardHead title="Profile details" subtitle="How you appear across the workspace" />
          <form className="form-grid" onSubmit={handleProfileSubmit}>
            {profileError ? <Banner tone="error">{profileError}</Banner> : null}
            {profileMessage ? <Banner tone="success">{profileMessage}</Banner> : null}

            <Field label="Full name" htmlFor="profile-name">
              <div className="input-affix">
                <span className="input-affix__icon">
                  <IconUser width={17} height={17} />
                </span>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </div>
            </Field>

            <Field label="Email" htmlFor="profile-email" hint="Email is managed by your administrator">
              <div className="input-affix">
                <span className="input-affix__icon">
                  <IconShield width={17} height={17} />
                </span>
                <Input id="profile-email" value={user?.email ?? ''} disabled />
              </div>
            </Field>

            <Field label="Avatar URL" htmlFor="profile-image" hint="Optional — paste a public image link">
              <Input
                id="profile-image"
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="https://…"
              />
            </Field>

            <div className="form-actions">
              <Button type="submit" variant="primary" loading={updateProfile.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHead title="Change password" subtitle="Keep your account secure" />
          <form className="form-grid" onSubmit={handlePasswordSubmit}>
            {passwordError ? <Banner tone="error">{passwordError}</Banner> : null}
            {passwordMessage ? <Banner tone="success">{passwordMessage}</Banner> : null}

            <Field label="Current password" htmlFor="current-password">
              <div className="input-affix">
                <span className="input-affix__icon">
                  <IconLock width={17} height={17} />
                </span>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </Field>

            <Field label="New password" htmlFor="new-password" hint="Minimum 6 characters">
              <div className="input-affix">
                <span className="input-affix__icon">
                  <IconLock width={17} height={17} />
                </span>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </Field>

            <Field label="Confirm new password" htmlFor="confirm-password">
              <div className="input-affix">
                <span className="input-affix__icon">
                  <IconLock width={17} height={17} />
                </span>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </Field>

            <div className="form-actions">
              <Button type="submit" variant="primary" loading={changePassword.isPending}>
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
