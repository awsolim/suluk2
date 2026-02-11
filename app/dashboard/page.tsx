import Link from 'next/link'
import Shell from '@/components/Shell'
import { getRole, requireAuth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export default async function DashboardPage() {
  const user = await requireAuth()
  const role = await getRole()
  const supabase = await supabaseServer()

  if (role === 'student') {
    const { data: enrollRows } = await supabase
      .from('program_enrollments')
      .select('program_id')
      .eq('student_id', user.id)

    const programIds = (enrollRows ?? []).map((r: any) => r.program_id)

    const { data: programs } =
      programIds.length === 0
        ? { data: [] as any[] }
        : await supabase
            .from('programs')
            .select('id,name')
            .in('id', programIds)

    return (
      <Shell title="Dashboard">
        <div className="grid gap-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold">Current Programs</div>
            <div className="mt-4 grid gap-2">
              {programs && programs.length > 0 ? (
                programs.map((p: any) => (
                  <Link key={p.id} href={`/programs/${p.id}`} className="underline underline-offset-2">
                    {p.name}
                  </Link>
                ))
              ) : (
                <div className="text-sm text-gray-600">You are not enrolled in any programs yet.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold">Browse New Programs</div>
            <div className="mt-4">
              <Link
                href="/programs"
                className="inline-flex items-center rounded-full bg-red-700 px-5 py-2 text-sm font-medium text-white hover:brightness-110"
              >
                Browse programs
              </Link>
            </div>
          </section>
        </div>
      </Shell>
    )
  }

  if (role === 'teacher') {
    const { data: programs } = await supabase
      .from('programs')
      .select('id,name')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    return (
      <Shell title="Teacher Dashboard">
        <div className="grid gap-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold">Current Programs</div>
            <div className="mt-4 grid gap-2">
              {programs && programs.length > 0 ? (
                programs.map((p: any) => (
                  <Link key={p.id} href={`/programs/${p.id}`} className="underline underline-offset-2">
                    {p.name}
                  </Link>
                ))
              ) : (
                <div className="text-sm text-gray-600">No programs yet.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold">Launch New Program</div>
            <div className="mt-4">
              <Link
                href="/programs/new"
                className="inline-flex items-center rounded-full bg-red-700 px-5 py-2 text-sm font-medium text-white hover:brightness-110"
              >
                Create program
              </Link>
            </div>
          </section>
        </div>
      </Shell>
    )
  }

  // admin
  const { data: programs } = await supabase
    .from('programs')
    .select('id,name')
    .order('created_at', { ascending: false })

  return (
    <Shell title="Admin Dashboard">
      <div className="grid gap-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Manage Users</div>
          <div className="mt-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-full bg-red-700 px-5 py-2 text-sm font-medium text-white hover:brightness-110"
            >
              Open user manager
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Manage Programs</div>
          <div className="mt-4 grid gap-2">
            {programs && programs.length > 0 ? (
              programs.map((p: any) => (
                <Link key={p.id} href={`/programs/${p.id}`} className="underline underline-offset-2">
                  {p.name}
                </Link>
              ))
            ) : (
              <div className="text-sm text-gray-600">No programs yet.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Launch New Program</div>
          <div className="mt-4">
            <Link
              href="/programs/new"
              className="inline-flex items-center rounded-full bg-red-700 px-5 py-2 text-sm font-medium text-white hover:brightness-110"
            >
              Create program
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  )
}
