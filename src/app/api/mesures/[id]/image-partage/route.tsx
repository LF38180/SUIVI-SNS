import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/db'
import { statutDe } from '@/lib/statut'
import { SNS, policesSNS, tronquer, moisAnnee } from '@/lib/charte-image'

// Image carrée 1080×1080 conforme à la CHARTE SNS (vignette « intérieure ») :
// fond crème, bandeau orange 14px, logo bicolore, titre + soulignement 220×8,
// carte blanche à barre d'accent, gros chiffre héro. Voir CHARTE_SNS.md.
// Param optionnel ?avant=N : met en scène un saut d'avancement (avant → maintenant).
export const contentType = 'image/png'

const ORANGE = SNS.orange
const CREAM = SNS.cream
const DARK = SNS.dark
const GRAY = SNS.gray
const GREEN = SNS.green

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const avantParam = new URL(req.url).searchParams.get('avant')
  const avant = avantParam != null && /^\d+$/.test(avantParam) ? Math.max(0, Math.min(100, Number(avantParam))) : null
  const mesure = await prisma.mesure.findFirst({
    where: { id: Number(id), deletedAt: null, statutMesure: 'VALIDEE' },
    select: {
      intitule: true,
      avancementPublie: true,
      categorie: true,
      // dernière proposition validée AVEC un mot de l'élu → « mot » + date de mise à jour
      propositions: {
        where: { statut: 'VALIDEE', commentaire: { not: null } },
        orderBy: { traiteeLe: 'desc' },
        take: 1,
        select: { commentaire: true, traiteeLe: true },
      },
      // date de dernière validation (même sans mot) pour « Mis à jour en … »
      historique: { orderBy: { date: 'desc' }, take: 1, select: { date: true } },
    },
  })
  if (!mesure) return new Response('Introuvable', { status: 404 })

  const fonts = await policesSNS()

  const pct = mesure.avancementPublie
  const statut = statutDe(pct).nom
  const tenu = pct >= 100
  const horsProg = mesure.categorie === 'HORS_PROGRAMME'
  // Mode « avant/après » : un saut d'avancement à mettre en scène.
  const saut = avant != null && avant < pct
  const etiquette = saut
    ? (tenu ? 'C’EST FAIT' : 'ÇA AVANCE')
    : horsProg
      ? 'AU-DELÀ DU PROGRAMME'
      : tenu
        ? 'ENGAGEMENT TENU'
        : 'NOTRE PROGRAMME EN ACTION'

  const motElu = mesure.propositions[0]?.commentaire ? tronquer(mesure.propositions[0].commentaire, 160) : null
  const dateMaj = mesure.propositions[0]?.traiteeLe ?? mesure.historique[0]?.date ?? null
  const misAJour = dateMaj ? `Mis à jour en ${moisAnnee(dateMaj)}` : null
  // badge vert pour « au-delà du programme » ou pour un saut mis en scène
  const badgeVert = horsProg || saut
  const rempliAvant = avant != null ? Math.round((860 * avant) / 100) : 0

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
                color: badgeVert ? '#fff' : ORANGE,
                background: badgeVert ? GREEN : '#fff',
                border: badgeVert ? 'none' : `2px solid ${ORANGE}`,
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

          {/* Mot de l'élu (dernière mise à jour validée) — bloc citation */}
          {motElu && (
            <div style={{ display: 'flex', marginTop: 34 }}>
              <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: ORANGE, lineHeight: 1, marginRight: 12 }}>“</div>
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 400, color: DARK, lineHeight: 1.38, flex: 1 }}>{motElu}</div>
            </div>
          )}

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
                {saut ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', fontSize: 54, fontWeight: 600, color: GRAY, marginBottom: 12 }}>{avant}%</div>
                    <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: GREEN, margin: '0 14px 12px' }}>→</div>
                    <div style={{ display: 'flex', fontSize: 110, fontWeight: 700, color: ORANGE, lineHeight: 1, letterSpacing: -3 }}>{pct}%</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', fontSize: 110, fontWeight: 700, color: ORANGE, lineHeight: 1, letterSpacing: -3 }}>{pct}%</div>
                )}
              </div>
              <div style={{ display: 'flex', width: railW, height: 22, background: '#F1DFD6', borderRadius: 20, marginTop: 14 }}>
                {/* part déjà acquise « avant » (plus pâle) puis le gain en orange */}
                {saut && <div style={{ display: 'flex', width: rempliAvant, height: 22, background: '#F6B79B', borderRadius: 20 }} />}
                <div style={{ display: 'flex', width: rempli - (saut ? rempliAvant : 0), height: 22, background: ORANGE, borderRadius: 20, marginLeft: saut ? -20 : 0 }} />
              </div>
            </div>
          </div>

          {/* Pied : identité + date de mise à jour */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 400, color: GRAY }}>
              Suivi de notre programme municipal 2026-2032
            </div>
            {misAJour && <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, color: ORANGE }}>{misAJour}</div>}
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts },
  )
}
