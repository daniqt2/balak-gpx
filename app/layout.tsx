import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BALAK GPX Editor',
  description: 'Editor de rutas GPX para ciclismo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" style={{ height: '100%' }}>
      <body style={{ height: '100%', margin: 0 }}>{children}</body>
    </html>
  )
}
