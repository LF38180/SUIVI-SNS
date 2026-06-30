import { ImageResponse } from 'next/og'
import { toutesLesMesures, moyenne } from '@/lib/requetes'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Suivi du programme Seyssins Nature & Solidaire'
// L'image dépend de la base de données → ne pas pré-générer au build
export const dynamic = 'force-dynamic'

export default async function Image() {
  const mesures = await toutesLesMesures()
  const programme = mesures.filter((m) => m.categorie !== 'HORS_PROGRAMME')
  const global = moyenne(programme.map((m) => m.avancementPublie))
  const realisees = programme.filter((m) => m.avancementPublie >= 100).length

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#FAF7F4',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#EE6B3E' }}>
          Seyssins
          <span style={{ color: '#6E6E73', fontWeight: 400, marginLeft: 4 }}>Nature&amp;Solidaire</span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#232326', marginTop: 30, lineHeight: 1.1 }}>
          {global}% du programme avancé
        </div>
        <div style={{ fontSize: 36, color: '#C0461F', marginTop: 20 }}>
          {realisees} engagement{realisees > 1 ? 's' : ''} tenu{realisees > 1 ? 's' : ''} sur {programme.length}
        </div>
        <div style={{ fontSize: 24, color: '#6E6E73', marginTop: 40 }}>
          Suivi de notre programme municipal 2026-2032
        </div>
      </div>
    ),
    size,
  )
}
