import { useState } from 'react'
import { IconTrash, IconUsers } from '../components/icons'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Banner, Button, Card, ConfirmDialog, EmptyState, LoadingBlock, Pagination, Select } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useDeleteUser, useUpdateUser, useUsers } from '../hooks/useUsers'
import { getErrorMessage } from '../lib/errors'
import { formatDate } from '../lib/format'
import type { Role, User } from '../types'

const PAGE_SIZE = 10

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  const usersQuery = useUsers({ page, limit: PAGE_SIZE })
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const data = usersQuery.data
  const users = data?.users ?? []
  const meta = data?.meta

  const handleRoleChange = async (target: User, role: Role) => {
    if (target.role === role) return
    setError(null)
    setBusyId(String(target.id))
    try {
      await updateUser.mutateAsync({ id: target.id, payload: { role } })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setError(null)
    try {
      await deleteUser.mutateAsync(deleting.id)
      setDeleting(null)
    } catch (err) {
      setError(getErrorMessage(err))
      setDeleting(null)
    }
  }

  return (
    <div className="stack">
      {error ? <Banner tone="error">{error}</Banner> : null}

      <Card>
        {usersQuery.isLoading ? (
          <LoadingBlock label="Loading people…" />
        ) : usersQuery.isError ? (
          <Banner tone="error">We could not load the user directory right now.</Banner>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<IconUsers width={24} height={24} />}
            title="No users found"
            description="There are no accounts to administer yet."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <Avatar name={user.name} src={user.image} size="sm" />
                          <div className="user-cell__text">
                            <div className="user-cell__name">
                              {user.name}
                              {isSelf ? <Badge tone="unread">You</Badge> : null}
                            </div>
                            <div className="user-cell__email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Select
                          className="select--sm"
                          value={user.role}
                          disabled={busyId === String(user.id)}
                          onChange={(event) => handleRoleChange(user, event.target.value as Role)}
                          aria-label={`Role for ${user.name}`}
                        >
                          <option value="user">Member</option>
                          <option value="admin">Administrator</option>
                        </Select>
                      </td>
                      <td className="muted">{formatDate(user.created_at)}</td>
                      <td>
                        <div className="table__actions">
                          <Button
                            variant="subtle"
                            size="sm"
                            iconOnly
                            icon={<IconTrash width={16} height={16} />}
                            onClick={() => setDeleting(user)}
                            disabled={isSelf || busyId === String(user.id)}
                            aria-label={`Delete ${user.name}`}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 ? (
          <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPageChange={setPage} />
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete user"
        message={
          <>
            Permanently remove <strong className="strong">{deleting?.name}</strong> and all of their
            tasks? This cannot be undone.
          </>
        }
        confirmLabel="Delete user"
        loading={deleteUser.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
