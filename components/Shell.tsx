import Link from 'next/link'
import { signOut } from '../lib/auth'

type Props = {
  title: string
  backLabel?: string
  backHref?: string
  children: React.ReactNode
}

const btnPrimary =
  'inline-flex items-center rounded-full bg-gradient-to-r from-red-700 to-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-red-800 hover:to-red-700'

export default function Shell({
  title,
  backLabel,
  backHref = '/dashboard',
  children,
}: Props) {
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

        <form action={signOut}>
          <button type="submit" className={btnPrimary}>
            Sign out
          </button>
        </form>
      </header>

      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>

      {children}
    </div>
  )
}
