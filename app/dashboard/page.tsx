import Link from 'next/link'
import Shell from '../../components/Shell'
import { requireAuth, getRole } from '../../lib/auth'
import { supabaseServer } from '../../lib/supabase'

const btnPrimary =
  'inline-flex items-center rounded-full bg-gradient-to-r from-red-700 to-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-red-800 hover:to-red-700'

export default async function DashboardPage() {
  const user = await requireAuth()
  const role = await getRole()
  const supabase = await supabaseServer()

  if (role === 'student') {
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('programs(name)')
      .eq('student_id', user.id)

    const programNames =
      enrollments?.map((e: any) => e.programs?.name).filter(Boolean) ?? []

    return (
      <Shell title="Student Dashboard">
        <div className="grid gap-4">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Current Programs</h2>
            {programNames.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No enrollments yet.</p>
            ) : (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {programNames.map((name: string) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Browse New Programs</h2>
            <p className="mt-1 text-sm text-gray-600">
              Explore available programs and request enrollment.
            </p>

            <Link href="/programs" className={`${btnPrimary} mt-4`}>
              Browse programs
            </Link>
          </section>
        </div>
      </Shell>
    )
  }

  if (role === 'teacher') {
    return (
      <Shell title="Teacher Dashboard">
        <div className="grid gap-4">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Current Programs</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your programs will appear here.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Launch New Program</h2>

            <Link href="/programs/new" className={`${btnPrimary} mt-4`}>
              Create program
            </Link>
          </section>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Admin Dashboard">
      <div className="grid gap-4">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Manage Users</h2>

          <Link href="/admin/users" className={`${btnPrimary} mt-4`}>
            View users
          </Link>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Launch New Program</h2>

          <Link href="/programs/new" className={`${btnPrimary} mt-4`}>
            Create program
          </Link>
        </section>
      </div>
    </Shell>
  )
}
