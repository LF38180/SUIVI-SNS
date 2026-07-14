import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prisma } from '@/lib/db'
import { statutDe } from '@/lib/statut'

// Image carrée 1080×1080 conforme à la CHARTE SNS (vignette « intérieure ») :
// fond crème, bandeau orange 14px, logo bicolore, titre + soulignement 220×8,
// carte blanche à barre d'accent, gros chiffre héro. Voir CHARTE_SNS.md.
export const contentType = 'image/png'

const ORANGE = '#EE6B3E'
const CREAM = '#FAF7F4'
const DARK = '#232326'
const GRAY = '#6E6E73'
const GREEN = '#478D4C'

// Polices Poppins (charte : vignettes réseaux en Poppins).
async function police(poids: 400 | 600 | 700) {
  return readFile(join(process.cwd(), 'src/assets/fonts', `Poppins-${poids}.ttf`))
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mesure = await prisma.mesure.findFirst({
    where: { id: Number(id), deletedAt: null, statutMesure: 'VALIDEE' },
    select: { intitule: true, avancementPublie: true, categorie: true },
  })
  if (!mesure) return new Response('Introuvable', { status: 404 })

  const [p400, p600, p700] = await Promise.all([police(400), police(600), police(700)])

  const pct = mesure.avancementPublie
  const statut = statutDe(pct).nom
  const tenu = pct >= 100
  const horsProg = mesure.categorie === 'HORS_PROGRAMME'
  const etiquette = horsProg ? 'AU-DELÀ DU PROGRAMME' : tenu ? 'ENGAGEMENT TENU' : 'NOTRE PROGRAMME EN ACTION'

  const railW = 860
  const rempli = Math.round((railW * Math.max(0, Math.min(100, pct))) / 100)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: CREAM,
          fontFamily: 'Poppins',
        }}
      >
        {/* Bandeau orange 14px pleine largeur (vignette intérieure) */}
        <div style={{ display: 'flex', width: '100%', height: 14, background: ORANGE }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '60px 80px 80px' }}>
          {/* Logo bicolore */}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.04 }}>
            <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: ORANGE, letterSpacing: -1 }}>Seyssins</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 400, color: GRAY }}>Nature&amp;Solidaire</div>
          </div>

          {/* Étiquette (badge) */}
          <div style={{ display: 'flex', marginTop: 34 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 19,
                fontWeight: 600,
                color: horsProg ? '#fff' : ORANGE,
                background: horsProg ? GREEN : '#fff',
                border: horsProg ? 'none' : `2px solid ${ORANGE}`,
                padding: '13px 28px',
                borderRadius: 999,
                letterSpacing: 1.2,
              }}
            >
              {etiquette}
            </div>
          </div>

          {/* Titre = intitulé de la mesure + soulignement 220×8 */}
          <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: DARK, marginTop: 30, lineHeight: 1.08, letterSpacing: -1 }}>
            {mesure.intitule}
          </div>
          <div style={{ display: 'flex', width: 220, height: 8, background: ORANGE, borderRadius: 4, marginTop: 20 }} />

          {/* Carte blanche : avancement, avec barre d'accent orange à gauche */}
          <div style={{ display: 'flex', marginTop: 'auto' }}>
            <div style={{ display: 'flex', width: 6, background: ORANGE, borderRadius: 3 }} />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                marginLeft: 14,
                background: '#fff',
                borderRadius: 18,
                padding: '28px 32px',
                boxShadow: '0 4px 18px rgba(35,35,38,.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: GRAY }}>{statut}</div>
                <div style={{ display: 'flex', fontSize: 110, fontWeight: 700, color: ORANGE, lineHeight: 1, letterSpacing: -3 }}>{pct}%</div>
              </div>
              <div style={{ display: 'flex', width: railW, height: 22, background: '#F1DFD6', borderRadius: 20, marginTop: 14 }}>
                <div style={{ display: 'flex', width: rempli, height: 22, background: ORANGE, borderRadius: 20 }} />
              </div>
            </div>
          </div>

          {/* Pied */}
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 400, color: GRAY, marginTop: 30 }}>
            Suivi de notre programme municipal 2026-2032
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: 'Poppins', data: p400, weight: 400, style: 'normal' },
        { name: 'Poppins', data: p600, weight: 600, style: 'normal' },
        { name: 'Poppins', data: p700, weight: 700, style: 'normal' },
      ],
    },
  )
}
