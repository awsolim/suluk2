'use server'

import { redirect } from 'next/navigation'
import { supabaseServer } from './supabase'

export type Role = 'student' | 'teacher' | 'admin'

export async function getUser() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function getRole(): Promise<Role> {
  const user = await getUser()
  if (!user) return 'student'

  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !data?.role) return 'student'
  return data.role as Role
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(allowed: Role[]) {
  await requireAuth()
  const role = await getRole()
  if (!allowed.includes(role)) redirect('/dashboard')
  return role
}

export async function signOut() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}
