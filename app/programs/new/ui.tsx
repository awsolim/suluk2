'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseBrowser } from '../../../lib/supabase'

export default function NewProgramForm({
  mosques,
}: {
  mosques: Array<{ id: string; name: string; address: string | null }>
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)

    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const mosqueId = String(formData.get('mosque_id') || '').trim()
    const priceRaw = String(formData.get('price') || '').trim()
    const file = formData.get('image') as File | null

    if (!name) {
      setError('Name is required.')
      return
    }
    if (!mosqueId) {
      setError('Mosque is required.')
      return
    }

    const price =
      priceRaw.length > 0 && !Number.isNaN(Number(priceRaw))
        ? Number(priceRaw)
        : null

    const supabase = supabaseBrowser()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      setError('Not signed in.')
      return
    }

    let imagePath: string | null = null

    if (file && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      imagePath = `thumbnails/${userData.user.id}/${Date.now()}-${safeName}`

      const { error: uploadErr } = await supabase.storage
        .from('media')
        .upload(imagePath, file, { upsert: false })

      if (uploadErr) {
        setError(uploadErr.message)
        return
      }
    }

    const { error: insertErr } = await supabase.from('programs').insert({
      name,
      description: description || null,
      mosque_id: mosqueId,
      teacher_id: userData.user.id,
      image_path: imagePath,
      price,
    })

    if (insertErr) {
      setError(insertErr.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="label" htmlFor="name">
          Program name
        </label>
        <input id="name" name="name" required className="input" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea id="description" name="description" className="input" rows={4} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="label" htmlFor="mosque_id">
          Mosque
        </label>
        <select id="mosque_id" name="mosque_id" required className="input">
          <option value="">Select a mosque</option>
          {mosques.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.address ? ` — ${m.address}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="label" htmlFor="price">
          Price (optional)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          className="input"
          placeholder="e.g. 50.00"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="label" htmlFor="image">
          Thumbnail (optional)
        </label>
        <input id="image" name="image" type="file" accept="image/*" />
        <p className="text-xs muted">
          Uploads to media/thumbnails/ and saves the path in programs.image_path
        </p>
      </div>

      <button type="submit" className="btn btn-primary mt-2">
        Create program
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  )
}
