import Shell from '../../../components/Shell'
import { requireAuth } from '../../../lib/auth'
import { supabaseServer } from '../../../lib/supabase'

type Mosque = { name: string; address: string | null }
type Teacher = { full_name: string; image_path: string | null }

type ProgramRow = {
  id: string
  name: string
  description: string | null
  image_path: string | null
  mosque: Mosque | Mosque[] | null
  teacher: Teacher | Teacher[] | null
}

function normalizeBucketPath(path: string | null) {
  if (!path) return null
  return path.replace(/^\/+/, '').replace(/^media\//, '')
}

function publicUrl(bucket: string, path: string | null, supabase: any) {
  const clean = normalizeBucketPath(path)
  if (!clean) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(clean)
  return data.publicUrl || null
}

function one<T>(rel: T | T[] | null | undefined) {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  if (typeof rel === 'object') return rel
  return null
}

export default async function ProgramDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAuth()
  const supabase = await supabaseServer()

  const { data, error } = await supabase
    .from('programs')
    .select(
      `
        id,
        name,
        description,
        image_path,
        mosque:mosques!programs_mosque_id_fkey(name,address),
        teacher:profiles!programs_teacher_id_fkey(full_name,image_path)
      `
    )
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return (
      <Shell title="Program" backLabel="Back to programs">
        <p className="text-sm text-red-600">
          {error?.message || 'Program not found.'}
        </p>
      </Shell>
    )
  }

  const p = data as ProgramRow
  const mosque = one(p.mosque)
  const teacher = one(p.teacher)

  const thumbUrl = publicUrl('media', p.image_path, supabase)
  const location = mosque?.address?.trim() || mosque?.name || '—'
  const teacherName = teacher?.full_name || '—'

  return (
    <Shell title="Program" backLabel="Back to programs">
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="h-56 w-full bg-gray-100">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
              No thumbnail
            </div>
          )}
        </div>

        <div className="p-5">
          <h1 className="text-xl font-semibold">{p.name}</h1>

          <div className="mt-2 text-sm text-gray-700">{location}</div>
          <div className="mt-1 text-sm text-gray-600">Led by: {teacherName}</div>

          <div className="divider" />

          {p.description ? (
            <p className="text-sm text-gray-700">{p.description}</p>
          ) : (
            <p className="text-sm muted">More details coming soon.</p>
          )}
        </div>
      </div>
    </Shell>
  )
}
