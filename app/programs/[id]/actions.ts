'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export async function enroll(programId: string) {
  const user = await requireAuth()
  const supabase = await supabaseServer()

  const { error } = await supabase.from('program_enrollments').insert({
    program_id: programId,
    student_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/programs')
  revalidatePath(`/programs/${programId}`)
  revalidatePath('/dashboard')
}

export async function withdraw(programId: string) {
  const user = await requireAuth()
  const supabase = await supabaseServer()

  const { error } = await supabase
    .from('program_enrollments')
    .delete()
    .eq('program_id', programId)
    .eq('student_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/programs')
  revalidatePath(`/programs/${programId}`)
  revalidatePath('/dashboard')
}
