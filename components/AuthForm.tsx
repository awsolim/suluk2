'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '../lib/supabase'
import Link from 'next/link'

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const supabase = supabaseBrowser()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const fullName = String(formData.get('full_name') || '').trim()

    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          })

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const title = mode === 'login' ? 'Log in' : 'Create your account'
  const cta = mode === 'login' ? 'Log in' : 'Sign up'

  return (
    <main className="center-wrap">
      <section className="card">
        <div className="text-center">
          <h1 className="title">{title}</h1>
          <p className="subtitle">
            {mode === 'login'
              ? 'Welcome back. Sign in to continue.'
              : 'Sign up to start as a student.'}
          </p>
        </div>

        <div className="divider" />

        <form action={onSubmit} className="flex flex-col gap-3">
          {mode === 'register' ? (
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="full_name">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                className="input"
                placeholder="Full name"
                required
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="Password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-2"
            disabled={loading}
          >
            {loading ? 'Please wait…' : cta}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>

        <div className="mt-4 text-center">
          {mode === 'login' ? (
            <Link className="link" href="/register">
              Need an account? Sign up
            </Link>
          ) : (
            <Link className="link" href="/login">
              Already have an account? Log in
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
