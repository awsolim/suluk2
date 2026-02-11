import Link from 'next/link'
import ProfileMenu from './ProfileMenu'
import { getUser, signOut } from '../lib/auth'
import { supabaseServer } from '../lib/supabase'

type Props = {
  title: string
  backLabel?: string
  backHref?: string
  children: React.ReactNode
}

const btnPrimary =
  'inline-flex items-center rounded-full bg-gradient-to-r from-red-700 to-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-red-800 hover:to-red-700'

const DEFAULT_AVATAR_PATH = 'avatars/default.jpg'

export default async function Shell({
  title,
  backLabel,
  backHref = '/dashboard',
  children,
}: Props) {
  const user = await getUser()

  let fullName = ''
  let avatarUrl: string | null = null

  if (user) {
    const supabase = await supabaseServer()
    const { data } = await supabase
      .from('profiles')
      .select('full_name, image_path')
      .eq('id', user.id)
      .single()

    fullName = data?.full_name ?? ''

    const path =
      data?.image_path && data.image_path.trim() !== ''
        ? data.image_path
        : DEFAULT_AVATAR_PATH

    const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`
  }

  return (
    <div className="container pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          {backLabel ? (
            <Link href={backHref} className={btnPrimary}>
              {backLabel}
            </Link>
          ) : (
            <div />
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && <ProfileMenu fullName={fullName} avatarUrl={avatarUrl} />}
          <form action={signOut}>
            <button type="submit" className={btnPrimary}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>

      {children}
    </div>
  )
}
