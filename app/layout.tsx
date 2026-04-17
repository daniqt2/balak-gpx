import type { Metadata } from 'next'
import './globals.css'
import I18nWrapper from '@/components/I18nWrapper'

const BASE_URL = 'https://gpx.balakride.com'

export const metadata: Metadata = {
  title: {
    default: 'BALAK GPX Editor — Cycling Route Planner',
    template: '%s | BALAK GPX Editor',
  },
  description:
    'Free cycling GPX editor. Upload a GPX route, annotate mountain passes, feed zones and hazards, add pacing zones, and export back to Garmin or Strava.',
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
    title: 'BALAK GPX Editor — Cycling Route Planner',
    description:
      'Upload a GPX route, annotate mountain passes, feed zones and hazards, add pacing zones, and export back to Garmin or Strava.',
    images: [{ url: '/favicon.png', width: 1024, height: 1024, alt: 'BALAK GPX Editor' }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'BALAK GPX Editor — Cycling Route Planner',
    description: 'Free tool to annotate and edit cycling GPX routes.',
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
    <html lang="en" style={{ height: '100%' }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'BALAK GPX Editor',
              url: BASE_URL,
              description: 'Free cycling GPX editor to annotate routes with mountain passes, feed zones, pacing and more.',
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
      </body>
    </html>
  )
}
