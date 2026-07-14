import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/db'
import { statutDe } from '@/lib/statut'

// Image carrée 1080×1080 aux couleurs SNS, générée à la volée pour une mesure.
// Sert au partage sur les réseaux (téléchargement depuis la vue publique / la fiche).
// v1 : charte de l'application (orange #EE6B3E, beige). À ajuster quand Loïck
// fournit la charte de communication officielle du groupe.
export const contentType = 'image/png'

const ORANGE = '#EE6B3E'
const ORANGE_TXT = '#C0461F'
const BEIGE = '#FAF7F4'
const ENCRE = '#232326'
const GRIS = '#6E6E73'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mesure = await prisma.mesure.findFirst({
    where: { id: Number(id), deletedAt: null, statutMesure: 'VALIDEE' },
    select: { intitule: true, avancementPublie: true, categorie: true },
  })
  if (!mesure) return new Response('Introuvable', { status: 404 })

  const pct = mesure.avancementPublie
  const statut = statutDe(pct).nom
  const tenu = pct >= 100
  const horsProg = mesure.categorie === 'HORS_PROGRAMME'

  // largeur de la barre de progression (px) dans un rail de 920px
  const rail = 920
  const rempli = Math.round((rail * Math.max(0, Math.min(100, pct))) / 100)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: BEIGE,
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        {/* En-tête : identité du groupe */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: 800, color: ORANGE }}>Seyssins</div>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: 400, color: GRIS, marginLeft: 10 }}>Nature</div>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: 800, color: ORANGE, marginLeft: 6 }}>&amp;</div>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: 400, color: GRIS, marginLeft: 6 }}>Solidaire</div>
        </div>

        {/* Étiquette */}
        <div style={{ display: 'flex', marginTop: 46 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontWeight: 700,
              color: '#fff',
              background: horsProg ? '#2E6B33' : ORANGE,
              padding: '10px 22px',
              borderRadius: 40,
            }}
          >
            {horsProg ? 'AU-DELÀ DU PROGRAMME' : tenu ? 'ENGAGEMENT TENU' : 'NOTRE PROGRAMME EN ACTION'}
          </div>
        </div>

        {/* Intitulé de la mesure */}
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontWeight: 800,
            color: ENCRE,
            marginTop: 34,
            lineHeight: 1.15,
            flex: 1,
          }}
        >
          {mesure.intitule}
        </div>

        {/* Avancement */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', fontSize: 30, color: GRIS }}>{statut}</div>
            <div style={{ display: 'flex', fontSize: 90, fontWeight: 800, color: ORANGE_TXT, lineHeight: 1 }}>{pct}%</div>
          </div>
          <div style={{ display: 'flex', width: rail, height: 26, background: '#F1DFD6', borderRadius: 20, marginTop: 16 }}>
            <div style={{ display: 'flex', width: rempli, height: 26, background: ORANGE, borderRadius: 20 }} />
          </div>
        </div>

        {/* Pied */}
        <div style={{ display: 'flex', fontSize: 24, color: GRIS, marginTop: 40 }}>
          Suivi de notre programme municipal 2026-2032
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  )
}
