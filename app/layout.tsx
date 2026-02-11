import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suluk',
  description: 'Suluk — Qur’an memorization programs',
  manifest: '/manifest.webmanifest',
  themeColor: '#b91c1c',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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
