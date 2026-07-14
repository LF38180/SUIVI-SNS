import { ImageResponse } from 'next/og'
import { toutesLesMesures, moyenne } from '@/lib/requetes'
import { SNS, policesSNS, moisAnnee } from '@/lib/charte-image'

// Image « bilan global » 1080×1080 — style COUVERTURE de la charte SNS :
// fond orange plein, arcs décoratifs blancs en haut-droite, logo blanc, badge,
// gros chiffre héro. Pour les posts récapitulatifs (pas une mesure précise).
export const contentType = 'image/png'

export async function GET() {
  const mesures = await toutesLesMesures()
  const programme = mesures.filter((m) => m.categorie !== 'HORS_PROGRAMME')
  const global = moyenne(programme.map((m) => m.avancementPublie))
  const tenus = programme.filter((m) => m.avancementPublie >= 100).length
  const enCours = programme.filter((m) => m.avancementPublie > 0 && m.avancementPublie < 100).length
  const total = programme.length

  const fonts = await policesSNS()
  const badge = `AU ${moisAnnee(new Date()).toUpperCase()}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: SNS.orange,
          fontFamily: 'Poppins',
          position: 'relative',
          padding: '78px 80px 92px',
        }}
      >
        {/* Arcs décoratifs blancs en haut-droite (charte couverture) */}
        <div style={{ display: 'flex', position: 'absolute', top: -140, right: -120, width: 520, height: 520, borderRadius: '50%', border: '2px solid rgba(255,255,255,.55)' }} />
        <div style={{ display: 'flex', position: 'absolute', top: -40, right: -30, width: 340, height: 340, borderRadius: '50%', border: '2px solid rgba(255,255,255,.55)' }} />

        {/* Logo blanc */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, color: '#fff', letterSpacing: -1 }}>Seyssins</div>
          <div style={{ display: 'flex', fontSize: 23, fontWeight: 400, color: 'rgba(255,255,255,.88)' }}>Nature&amp;Solidaire</div>
        </div>

        {/* Badge date */}
        <div style={{ display: 'flex', marginTop: 44 }}>
          <div style={{ display: 'flex', fontSize: 19, fontWeight: 600, color: SNS.orange, background: '#fff', padding: '15px 30px', borderRadius: 999, letterSpacing: 1.2 }}>
            {badge}
          </div>
        </div>

        {/* Chiffre héro : % du programme */}
        <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 40 }}>
          <div style={{ display: 'flex', fontSize: 240, fontWeight: 700, color: '#fff', lineHeight: 0.9, letterSpacing: -4 }}>{global}</div>
          <div style={{ display: 'flex', fontSize: 90, fontWeight: 700, color: '#fff', marginBottom: 24 }}>%</div>
        </div>
        <div style={{ display: 'flex', fontSize: 42, fontWeight: 600, color: '#fff', marginTop: 4 }}>de notre programme avancé</div>

        {/* Détail engagements */}
        <div style={{ display: 'flex', marginTop: 'auto', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, padding: '22px 28px', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: SNS.orange, lineHeight: 1 }}>{tenus}</div>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 500, color: SNS.dark, marginTop: 4 }}>engagement{tenus > 1 ? 's' : ''} tenu{tenus > 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, padding: '22px 28px', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: SNS.orange, lineHeight: 1 }}>{enCours}</div>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 500, color: SNS.dark, marginTop: 4 }}>en cours</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, padding: '22px 28px', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: SNS.orange, lineHeight: 1 }}>{total}</div>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 500, color: SNS.dark, marginTop: 4 }}>engagements suivis</div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts },
  )
}
