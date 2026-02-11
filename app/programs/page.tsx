import Link from 'next/link'
import Shell from '@/components/Shell'
import { requireAuth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

type Program = {
  id: string
  name: string
  description: string | null
  image_path: string | null
  price: number | null
  mosque_id: string
  teacher_id: string
}

type Mosque = {
  id: string
  name: string | null
  address: string | null
}

type Teacher = {
  id: string
  full_name: string | null
}

export default async function ProgramsPage() {
  const user = await requireAuth()
  const supabase = await supabaseServer()

  const { data: programs, error: pErr } = await supabase
    .from('programs')
    .select('id,name,description,image_path,price,mosque_id,teacher_id')
    .order('created_at', { ascending: false })

  if (pErr) {
    return (
      <Shell title="Programs" backLabel="Back to dashboard" backHref="/dashboard">
        <div className="text-red-700">{pErr.message}</div>
      </Shell>
    )
  }

  const progList = (programs ?? []) as Program[]
const programIds = progList.map((p) => p.id)


  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('program_id')
    .eq('student_id', user.id)

  const enrolledSet = new Set((enrollments ?? []).map((e: any) => e.program_id))

  const mosqueIds = Array.from(new Set((programs ?? []).map((p: any) => p.mosque_id)))
  const teacherIds = Array.from(new Set((programs ?? []).map((p: any) => p.teacher_id)))

  const [{ data: mosques }, { data: teachers }] = await Promise.all([
    supabase.from('mosques').select('id,name,address').in('id', mosqueIds),
    supabase.from('profiles').select('id,full_name').in('id', teacherIds),
  ])

  const mosqueById = new Map<string, Mosque>()
  ;(mosques ?? []).forEach((m: any) => mosqueById.set(m.id, m))

  const teacherById = new Map<string, Teacher>()
  ;(teachers ?? []).forEach((t: any) => teacherById.set(t.id, t))

  function publicMediaUrl(path: string) {
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <Shell title="Programs" backLabel="Back to dashboard" backHref="/dashboard">
      <div className="grid gap-6 md:grid-cols-2">
        {(programs ?? []).map((p: any) => {
          const enrolled = enrolledSet.has(p.id)
          const mosque = mosqueById.get(p.mosque_id)
          const teacher = teacherById.get(p.teacher_id)

          const imgUrl =
            p.image_path && String(p.image_path).trim() !== ''
              ? publicMediaUrl(p.image_path)
              : null

          return (
            <Link
              key={p.id}
              href={`/programs/${p.id}`}
              className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-44 w-full bg-gray-100">
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt=""
                    className={`h-full w-full object-cover transition ${enrolled ? 'blur-[2px] brightness-50' : ''}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                    No thumbnail
                  </div>
                )}

                {enrolled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-3xl font-extrabold text-green-400 drop-shadow">
                      ENROLLED
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-lg font-semibold underline-offset-2 group-hover:underline">
                  {p.name}
                </div>

                <div className="mt-2 text-sm text-gray-700">
                  {mosque?.address ?? ''}
                </div>

                <div className="mt-1 text-sm text-gray-700">
                  Led by: {teacher?.full_name ?? '—'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Shell>
  )
}
