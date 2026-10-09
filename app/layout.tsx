import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = 'https://store.greatrascals.com'
const TITLE = 'GRRRR — Des produits pour leur bonheur'
const DESCRIPTION = 'La boutique GRRRR : accessoires, cadeaux et produits personnalisés pour les animaux et leurs humains.'

export const metadata: Metadata = {
  // Makes the image addresses below absolute, as search engines and share previews need them
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  generator: 'GRRRR',
  // The paw of the GRRRR logo, as on greatrascals.com; /favicon.ico holds the same picture
  icons: {
    icon: [
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'GRRRR',
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GRRRR' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-image.png'] },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fff8f2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="bg-background">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
