import './globals.css'
import type { Metadata } from 'next'

export const metadata = {
  title: 'Suluk',
  description: 'Explore Islamic programs offered at your local mosque',
  manifest: '/manifest.webmanifest',
  themeColor: '#991b1b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Suluk',
  },
  icons: {
    apple: '/icons/icon-192.png',
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
