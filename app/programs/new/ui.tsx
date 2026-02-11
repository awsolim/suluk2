'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '../../../lib/supabase'

type Role = 'student' | 'teacher' | 'admin'

type MosqueRow = {
  id: string
  name: string
  address: string | null
}

type TeacherRow = {
  id: string
  full_name: string
}

type Props = {
  role: Role
  userId: string
  mosques: MosqueRow[]
  teachers: TeacherRow[]
}

function cleanNumber(value: string) {
  const v = value.trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function NewProgramForm({ role, userId, mosques, teachers }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mosqueId, setMosqueId] = useState('')
  const [price, setPrice] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('Program name is required.')
    if (!mosqueId) return setError('Please select a mosque.')

    const resolvedTeacherId = role === 'admin' ? teacherId : userId
    if (!resolvedTeacherId) return setError('Please select a teacher.')

    setLoading(true)

    try {
      let imagePath: string | null = null

      if (file) {
        const safeName = file.name.replace(/\s+/g, '-')
        const objectPath = `thumbnails/${crypto.randomUUID()}-${safeName}`

        const upload = await supabase.storage.from('media').upload(objectPath, file, {
          upsert: false,
        })

        if (upload.error) throw new Error(upload.error.message)
        imagePath = objectPath
      }

      const priceValue = cleanNumber(price)

      const insert = await supabase.from('programs').insert({
        name: name.trim(),
        description: description.trim() || null,
        mosque_id: mosqueId,
        teacher_id: resolvedTeacherId,
        image_path: imagePath,
        price: priceValue,
      })

      if (insert.error) throw new Error(insert.error.message)

      router.push('/programs')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to create program.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Program name</label>
        <input
          className="mt-2 w-full rounded-xl border px-4 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Evening Hifz Program"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          className="mt-2 w-full rounded-xl border px-4 py-2"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Mosque</label>
        <select
          className="mt-2 w-full rounded-xl border px-4 py-2"
          value={mosqueId}
          onChange={(e) => setMosqueId(e.target.value)}
        >
          <option value="">Select a mosque</option>
          {mosques.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.address ? ` — ${m.address}` : ''}
            </option>
          ))}
        </select>
      </div>

      {role === 'admin' && (
        <div>
          <label className="block text-sm font-medium">Assign teacher</label>
          <select
            className="mt-2 w-full rounded-xl border px-4 py-2"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            <option value="">Select a teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Price (optional)</label>
        <input
          className="mt-2 w-full rounded-xl border px-4 py-2"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 50.00"
          inputMode="decimal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Thumbnail (optional)</label>
        <input
          className="mt-2 block w-full text-sm"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="mt-2 text-xs text-gray-600">
          Uploads to <span className="font-mono">media/thumbnails/</span> and saves the path in{' '}
          <span className="font-mono">programs.image_path</span>.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gradient-to-r from-red-700 to-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:from-red-800 hover:to-red-700 disabled:opacity-60"
      >
        {loading ? 'Creating…' : 'Create program'}
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
