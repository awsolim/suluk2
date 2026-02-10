import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suluk',
  description: 'A simple system for managing Qur’an memorization programs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
