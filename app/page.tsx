import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="center-wrap">
      <section className="card text-center">
        <h1 className="title">Suluk</h1>
        <p className="subtitle">
          A simple system for managing Qur’an memorization programs.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link className="btn btn-primary" href="/login">
            Log in
          </Link>
          <Link className="btn btn-ghost" href="/register">
            Sign up
          </Link>
        </div>
      </section>
    </main>
  )
}
