// app/admin/users/AdminUsersClient.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type Role = 'student' | 'teacher' | 'admin'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: Role
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]) // ✅ holds fetched users
  const [loading, setLoading] = useState(true) // ✅ loading state
  const [error, setError] = useState<string | null>(null) // ✅ error message

  async function loadUsers() {
    try {
      setLoading(true) // ✅ start loading
      setError(null) // ✅ clear previous errors

      const res = await fetch('/api/admin/users', { cache: 'no-store' }) // ✅ call your API route
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`) // ✅ hard fail for UI

      const json = (await res.json()) as { users: UserRow[] } // ✅ assume { users: [...] }
      setUsers(json.users ?? []) // ✅ store users
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load users') // ✅ show readable error
    } finally {
      setLoading(false) // ✅ stop loading
    }
  }

  useEffect(() => {
    loadUsers() // ✅ fetch on mount
  }, [])

  const students = useMemo(
    () => users.filter((u) => u.role === 'student'),
    [users]
  ) // ✅ derive list without recomputing unnecessarily
  const teachers = useMemo(
    () => users.filter((u) => u.role === 'teacher'),
    [users]
  ) // ✅ derive list without recomputing unnecessarily
  const admins = useMemo(
    () => users.filter((u) => u.role === 'admin'),
    [users]
  ) // ✅ derive list without recomputing unnecessarily

  async function setRole(userId: string, role: Role) {
    try {
      setError(null) // ✅ clear previous errors

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }), // ✅ send update payload
      })

      if (!res.ok) throw new Error(`Failed to update role (${res.status})`) // ✅ fail loudly
      await loadUsers() // ✅ reload to reflect changes
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update role') // ✅ display error
    }
  }

  async function removeUser(userId: string) {
    try {
      setError(null) // ✅ clear previous errors

      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error(`Failed to remove user (${res.status})`) // ✅ fail loudly
      await loadUsers() // ✅ reload to reflect changes
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove user') // ✅ display error
    }
  }

  function UserList({ title, list }: { title: string; list: UserRow[] }) {
    return (
      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>

        {list.length === 0 ? (
          <p className="text-sm text-neutral-600">No users.</p>
        ) : (
          <div className="space-y-3">
            {list.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {u.full_name?.trim() ? u.full_name : 'Unnamed user'}
                  </div>
                  <div className="text-sm text-neutral-600">{u.email}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value as Role)} // ✅ update role
                    className="rounded-full border px-3 py-2 text-sm"
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>

                  <button
                    onClick={() => removeUser(u.id)} // ✅ remove user
                    className="rounded-full border px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading users…</p>
  if (error) return <p className="text-sm text-red-700">{error}</p>

  return (
    <div className="space-y-6">
      <UserList title="Students" list={students} />
      <UserList title="Teachers" list={teachers} />
      <UserList title="Admins" list={admins} />
    </div>
  )
}
