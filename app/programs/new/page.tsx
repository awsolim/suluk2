import Shell from '../../../components/Shell'
import { requireRole } from '../../../lib/auth'
import { supabaseServer } from '../../../lib/supabase'
import NewProgramForm from './ui'

export default async function NewProgramPage() {
  await requireRole(['teacher', 'admin'])

  const supabase = await supabaseServer()
  const { data: mosques } = await supabase
    .from('mosques')
    .select('id, name, address')
    .order('created_at', { ascending: true })

  return (
    <Shell title="New Program" backLabel="Back to dashboard">
      <NewProgramForm mosques={mosques ?? []} />
    </Shell>
  )
}
