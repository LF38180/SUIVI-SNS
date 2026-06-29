import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Suivi du programme — Seyssins Nature & Solidaire',
  description: 'Tableau de bord de suivi des engagements du programme municipal 2026-2032.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  )
}
