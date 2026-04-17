import type { Metadata } from 'next'
import './globals.css'
import I18nWrapper from '@/components/I18nWrapper'

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
      <body style={{ height: '100%', margin: 0 }}>
        <I18nWrapper>{children}</I18nWrapper>
      </body>
    </html>
  )
}
