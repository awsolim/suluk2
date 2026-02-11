import Shell from '@/components/Shell'
import ProgramActions from './ProgramActions'
import { getRole, requireAuth } from '@/lib/auth'
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

type StudentRow = {
  id: string
  full_name: string | null
  image_path: string | null
}

export default async function ProgramDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!id) {
    return (
      <Shell title="Program" backLabel="Back to programs" backHref="/programs">
        <div className="text-red-700">Missing program id</div>
      </Shell>
    )
  }

  const user = await requireAuth()
  const role = await getRole()
  const supabase = await supabaseServer()

  const { data: program, error: pErr } = await supabase
    .from('programs')
    .select('id,name,description,image_path,price,mosque_id,teacher_id')
    .eq('id', id)
    .single()

  if (pErr || !program) {
    return (
      <Shell title="Program" backLabel="Back to programs" backHref="/programs">
        <div className="text-red-700">{pErr?.message ?? 'Program not found'}</div>
      </Shell>
    )
  }

  const p = program as Program

  const [{ data: mosque }, { data: teacherProfile }] = await Promise.all([
    supabase
      .from('mosques')
      .select('id,name,address,image_path')
      .eq('id', p.mosque_id)
      .single(),
    supabase
      .from('profiles')
      .select('id,full_name,phone_number,email,image_path')
      .eq('id', p.teacher_id)
      .single(),
  ])

  const { data: myEnrollment } = await supabase
    .from('program_enrollments')
    .select('program_id')
    .eq('program_id', p.id)
    .eq('student_id', user.id)
    .maybeSingle()

  const isEnrolled = !!myEnrollment

  const isTeacherOfProgram = role === 'teacher' && p.teacher_id === user.id
  const isAdmin = role === 'admin'
  const showTeacherAdminRightRoster = isAdmin || isTeacherOfProgram

  // Roster: only teacher of this program or admin sees it
  let roster: StudentRow[] = []

  if (showTeacherAdminRightRoster) {
    const { data: enrollRows } = await supabase
      .from('program_enrollments')
      .select('student_id')
      .eq('program_id', p.id)

    const studentIds = (enrollRows ?? []).map((r: any) => r.student_id)

    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id,full_name,image_path')
        .in('id', studentIds)

      roster = (students ?? []) as StudentRow[]
    }
  }

  function publicMediaUrl(path: string) {
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    return data.publicUrl
  }

  const programImgUrl =
    p.image_path && String(p.image_path).trim() !== ''
      ? publicMediaUrl(p.image_path)
      : null

  const mosqueImgUrl =
    mosque?.image_path && String(mosque.image_path).trim() !== ''
      ? publicMediaUrl(mosque.image_path)
      : null

  const teacherAvatarUrl =
    teacherProfile?.image_path && String(teacherProfile.image_path).trim() !== ''
      ? publicMediaUrl(teacherProfile.image_path)
      : null

  const isStudent = role === 'student'

  const rosterWithUrls = roster
    .map((s) => ({
      ...s,
      avatarUrl:
        s.image_path && String(s.image_path).trim() !== ''
          ? publicMediaUrl(s.image_path)
          : null,
    }))
    .sort((a, b) => String(a.full_name ?? '').localeCompare(String(b.full_name ?? '')))

  return (
    <Shell title="Program" backLabel="Back to programs" backHref="/programs">
      {/* Top Banner (row) */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="h-72 w-full bg-gray-100">
          {programImgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={programImgUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
              No thumbnail
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="text-3xl font-bold">{p.name}</div>
        </div>
      </div>

      {/* Below banner: two columns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: description (same for all) */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Description</div>
          <div className="mt-3 text-sm text-gray-700">
            {p.description ?? 'No description yet.'}
          </div>
        </div>

        {/* Right column */}
        <aside className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border bg-gray-100">
              {mosqueImgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mosqueImgUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="text-lg font-bold">{mosque?.name ?? 'Mosque'}</div>
              <div className="text-sm text-gray-700">{mosque?.address ?? ''}</div>
            </div>
          </div>

          <div className="mt-6">
            {isStudent ? (
              <ProgramActions
                programId={p.id}
                isEnrolled={isEnrolled}
                price={p.price}
                teacher={{
                  full_name: teacherProfile?.full_name ?? null,
                  phone_number: teacherProfile?.phone_number ?? null,
                  email: teacherProfile?.email ?? null,
                  image_url: teacherAvatarUrl,
                }}
              />
            ) : (
              <div className="grid gap-4">
                <div className="text-sm text-gray-700">
                  <div className="text-base font-semibold text-gray-900">Price per month</div>
                  <div className="mt-1 text-3xl font-extrabold">
                    {p.price == null ? '—' : `$${p.price}`}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-base font-semibold">Registered students</div>

                  {rosterWithUrls.length === 0 ? (
                    <div className="mt-3 text-sm text-gray-600">No students enrolled yet.</div>
                  ) : (
                    <div className="mt-3 grid gap-3">
                      {rosterWithUrls.map((s) => (
                        <div key={s.id} className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-full border bg-gray-100">
                            {s.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 text-sm font-medium">
                            {s.full_name ?? 'Student'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  )
}
