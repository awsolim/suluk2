'use client'

import { useEffect, useMemo, useState } from 'react'
import Shell from '../../../components/Shell'

type Role = 'student' | 'teacher' | 'admin'

type Profile = {
  id: string
  full_name: string
  role: Role
  created_at: string
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setError(null)
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to load users')
      setLoading(false)
      return
    }
    setProfiles(json.profiles || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    const out: Record<Role, Profile[]> = { student: [], teacher: [], admin: [] }
    for (const p of profiles) out[p.role].push(p)
    return out
  }, [profiles])

  async function setRole(userId: string, role: Role) {
    setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to update role')
      return
    }
    await load()
  }

  async function removeUser(userId: string) {
    setError(null)
    const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to delete user')
      return
    }
    await load()
  }

  return (
    <Shell title="Manage Users" backLabel="Back to dashboard">
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : (
        <div className="space-y-8">
          {(['admin', 'teacher', 'student'] as Role[]).map((role) => (
            <section key={role}>
              <h2 className="mb-2 font-semibold">
                {role[0].toUpperCase() + role.slice(1)}s
              </h2>

              {grouped[role].length === 0 ? (
                <p className="text-sm text-gray-600">None.</p>
              ) : (
                <div className="space-y-2">
                  {grouped[role].map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-xs text-gray-600">{p.id}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={p.role}
                          onChange={(e) => setRole(p.id, e.target.value as Role)}
                          className="rounded border px-2 py-1 text-sm"
                        >
                          <option value="student">student</option>
                          <option value="teacher">teacher</option>
                          <option value="admin">admin</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => removeUser(p.id)}
                          className="text-sm underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </Shell>
  )
}
