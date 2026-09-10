import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GRRRR — Des produits pour leur bonheur',
  description: 'La boutique GRRRR : accessoires, cadeaux et produits personnalisés pour les animaux et leurs humains.',
  generator: 'GRRRR',
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
