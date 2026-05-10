import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Home — Lights',
  description: 'Smart home dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: '100vh', overflow: 'hidden' }}>{children}</body>
    </html>
  )
}
