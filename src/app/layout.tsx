import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/Nav'

// Police auto-hébergée (pas de dépendance Google à l'exécution, pas de fuite IP RGPD,
// font-display swap → texte lisible vite sur 4G). Graisses réellement utilisées.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--police',
})

export const metadata: Metadata = {
  title: 'Suivi du programme — Seyssins Nature & Solidaire',
  description: 'Tableau de bord de suivi des engagements du programme municipal 2026-2032.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  )
}
