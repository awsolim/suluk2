import Link from 'next/link'
import Shell from '../../components/Shell'
import { requireAuth } from '../../lib/auth'
import { supabaseServer } from '../../lib/supabase'

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

export default async function ProgramsPage() {
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
    
    .order('created_at', { ascending: false })
    

  if (error) {
    return (
      <Shell title="Programs" backLabel="Back to dashboard">
        <p className="text-sm text-red-600">{error.message}</p>
      </Shell>
    )
  }

  const rows = (data ?? []) as ProgramRow[]

  return (
    <Shell title="Programs" backLabel="Back to dashboard">
      {rows.length === 0 ? (
        <p className="text-sm muted">No programs yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((p) => {
            const mosque = one(p.mosque)
            const teacher = one(p.teacher)

            const thumbUrl = publicUrl('media', p.image_path, supabase)
            const teacherAvatarUrl = publicUrl(
              'media',
              teacher?.image_path ?? null,
              supabase
            )

            const location = mosque?.address?.trim() || mosque?.name || '—'
            const teacherName = teacher?.full_name || '—'

            return (
              <Link
                key={p.id}
                href={`/programs/${p.id}`}
                className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-44 w-full bg-gray-100">
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                      No thumbnail
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
                      {teacherAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={teacherAvatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                          —
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold leading-snug group-hover:underline">
                    {p.name}
                  </h3>

                  <div className="mt-2 space-y-1 text-sm">
                    <div className="text-gray-700">{location}</div>
                    <div className="text-gray-600">Led by: {teacherName}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Shell>
  )
}
