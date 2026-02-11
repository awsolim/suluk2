'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '../../lib/supabase'

type Props = {
  initialFullName: string
  initialPhone: string
  initialImagePath: string | null
}

export default function ProfileForm({ initialFullName, initialPhone, initialImagePath }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])

  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadEmail() {
    const { data } = await supabase.auth.getUser()
    setEmail(data.user?.email ?? '')
  }

  useState(() => {
    loadEmail()
  })

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) throw new Error('Not signed in.')

      let imagePath: string | null = initialImagePath

      if (file) {
        const safeName = file.name.replace(/\s+/g, '-')
        const objectPath = `avatars/${user.id}/${crypto.randomUUID()}-${safeName}`

        const upload = await supabase.storage.from('media').upload(objectPath, file, { upsert: true })
        if (upload.error) throw new Error(upload.error.message)

        imagePath = objectPath
      }

      const profileUpdate = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone_number: phone.trim(),
          image_path: imagePath,
        })
        .eq('id', user.id)

      if (profileUpdate.error) throw new Error(profileUpdate.error.message)

      if (email.trim() && email.trim() !== (user.email ?? '')) {
        const emailUpdate = await supabase.auth.updateUser({ email: email.trim() })
        if (emailUpdate.error) throw new Error(emailUpdate.error.message)
      }

      if (newPassword.trim()) {
        const passUpdate = await supabase.auth.updateUser({ password: newPassword.trim() })
        if (passUpdate.error) throw new Error(passUpdate.error.message)
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Profile picture</label>
        <input
          className="mt-2 block w-full text-sm"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input
          className="mt-2 w-full rounded-xl border px-4 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Phone number</label>
        <input
          className="mt-2 w-full rounded-xl border px-4 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          className="mt-2 w-full rounded-xl border px-4 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">New password</label>
        <input
          className="mt-2 w-full rounded-xl border px-4 py-2"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to keep current password"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-gradient-to-r from-red-700 to-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:from-red-800 hover:to-red-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save and exit'}
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
