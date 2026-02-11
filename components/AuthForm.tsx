'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'

type Mode = 'login' | 'register'

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const fullName = String(formData.get('full_name') ?? '').trim()
    const phoneNumber = String(formData.get('phone_number') ?? '').trim()

    if (!email || !password) {
      setError('Email and password are required.')
      setLoading(false)
      return
    }

    if (mode === 'register') {
      if (!fullName) {
        setError('Full name is required.')
        setLoading(false)
        return
      }
      if (!phoneNumber) {
        setError('Phone number is required.')
        setLoading(false)
        return
      }
    }

    // IMPORTANT: declare result in the same scope that we read it
    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                // These keys MUST match your trigger function:
                // new.raw_user_meta_data->>'full_name'
                // new.raw_user_meta_data->>'phone_number'
                full_name: fullName,
                phone_number: phoneNumber,
              },
            },
          })

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    // After successful login/signup, go to dashboard
    router.push('/dashboard')
    router.refresh()
  }

  const title = mode === 'login' ? 'Log in' : 'Create your account'
  const subtitle = mode === 'login' ? 'Welcome back.' : 'Sign up to start as a student.'
  const cta = mode === 'login' ? 'Log in' : 'Sign up'

  return (
    <main className="center-wrap">
      <section className="card">
        <div className="text-center">
          <h1 className="title">{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>

        <form action={onSubmit} className="mt-6 grid gap-4">
          {mode === 'register' && (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="full_name">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  className="input"
                  placeholder="Full name"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="phone_number">
                  Phone number
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="input"
                  placeholder="+1 555 123 4567"
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="name@example.com"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              className="input"
              placeholder="Password"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : cta}
          </button>

          <div className="text-center text-sm">
            {mode === 'login' ? (
              <span>
                Don’t have an account?{' '}
                <a className="link" href="/register">
                  Sign up
                </a>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <a className="link" href="/login">
                  Log in
                </a>
              </span>
            )}
          </div>
        </form>
      </section>
    </main>
  )
}
