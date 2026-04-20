import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import I18nWrapper from '@/components/I18nWrapper'

const BASE_URL = 'https://gpx.balakride.com'

export const metadata: Metadata = {
  title: {
    default: 'BALAK GPX Editor — Editor de rutas ciclistas',
    template: '%s | BALAK GPX Editor',
  },
  description:
    'Editor GPX para ciclismo. Sube una ruta, añade puertos, avituallamientos y peligros, define zonas de pacing y expórtala para Garmin o para imprimir.',
  keywords: [
    'GPX editor', 'cycling route planner', 'GPX file editor', 'bike route editor',
    'Garmin route', 'cycling waypoints', 'pacing zones cycling', 'BALAK',
    'editor GPX ciclismo', 'planificador rutas ciclismo',
  ],
  authors: [{ name: 'BALAK', url: BASE_URL }],
  creator: 'BALAK',
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'BALAK GPX Editor',
    title: 'BALAK GPX Editor — Editor de rutas ciclistas',
    description:
      'Sube una ruta GPX, añade puertos, avituallamientos y peligros, define zonas de pacing y expórtala para Garmin o para imprimir.',
    images: [{ url: '/favicon.png', width: 1024, height: 1024, alt: 'BALAK GPX Editor' }],
    locale: 'es_ES',
    alternateLocale: ['en_US'],
  },
  twitter: {
    card: 'summary',
    title: 'BALAK GPX Editor — Editor de rutas ciclistas',
    description: 'Herramienta para subir, anotar y exportar rutas GPX de ciclismo.',
    images: ['/favicon.png'],
    creator: '@balak.ride',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
    shortcut: '/favicon.png',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={{ height: '100%' }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'BALAK GPX Editor',
              url: BASE_URL,
              description: 'Editor GPX para ciclismo para anotar rutas con puertos, avituallamientos, pacing y más.',
              applicationCategory: 'SportsApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
              author: { '@type': 'Organization', name: 'BALAK', url: 'https://www.balakride.com/' },
            }),
          }}
        />
      </head>
      <body style={{ height: '100%', margin: 0 }}>
        <I18nWrapper>{children}</I18nWrapper>
        <Analytics />
      </body>
    </html>
  )
}
