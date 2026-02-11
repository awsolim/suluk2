import Shell from '../../../components/Shell'
import { getRole, requireRole, requireAuth } from '../../../lib/auth'
import { supabaseServer } from '../../../lib/supabase'
import NewProgramForm from './ui'

export default async function NewProgramPage() {
  await requireRole(['teacher', 'admin'])
  const user = await requireAuth()
  const role = await getRole()

  const supabase = await supabaseServer()

  const { data: mosques } = await supabase
    .from('mosques')
    .select('id,name,address')
    .order('name', { ascending: true })

  const teachers =
    role === 'admin'
      ? (
          await supabase
            .from('profiles')
            .select('id,full_name')
            .eq('role', 'teacher')
            .order('full_name', { ascending: true })
        ).data ?? []
      : []

  return (
    <Shell title="New Program" backLabel="Back to dashboard" backHref="/dashboard">
      <NewProgramForm
        role={role}
        userId={user.id}
        mosques={mosques ?? []}
        teachers={teachers}
      />
    </Shell>
  )
}
