import { toutesLesMesures, moyenne, agregatsParAxe } from '@/lib/requetes'
import { Jauge } from '@/components/Jauge'
import { Barre } from '@/components/Barre'
import { EnTete } from '@/components/EnTete'
import { BadgeStatut } from '@/components/BadgeStatut'
import { NOMS_AXES } from '@/lib/axes'

export default async function VuePublique() {
  const mesures = await toutesLesMesures()
  const global = moyenne(mesures.map((m) => m.avancementPublie))
  const axes = agregatsParAxe(mesures)

  return (
    <>
      <EnTete
        titre="Suivi du programme municipal 2026-2032"
        sousTitre="Là où nous en sommes, engagement par engagement. Vue publique."
      />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <section style={{ marginTop: -34, position: 'relative', zIndex: 3 }}>
          <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Jauge pourcent={global} />
            <div>
              <h2>Avancement global du programme</h2>
              <div style={{ fontSize: 13, color: '#6E6E73' }}>{mesures.length} engagements suivis</div>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
              gap: 16,
              marginTop: 18,
            }}
          >
            {axes.map((a) => (
              <div key={a.axe} className="panel">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#EE6B3E' }}>{a.axe.replace('_', ' ')}</div>
                <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 8px', minHeight: 34 }}>{NOMS_AXES[a.axe]}</div>
                <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 6 }}>{a.pourcent}%</div>
                <Barre pourcent={a.pourcent} />
              </div>
            ))}
          </div>
        </section>

        {['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4'].map((a) => {
          const ms = mesures.filter((m) => m.categorie === a)
          return (
            <div key={a}>
              <div style={{ margin: '30px 0 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#EE6B3E', padding: '4px 10px', borderRadius: 6 }}>
                  {a.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{NOMS_AXES[a]}</span>
              </div>
              {ms.map((m) => (
                <div key={m.id} className="card">
                  <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 7 }}>{m.intitule}</div>
                  <div style={{ marginBottom: 8 }}>
                    <BadgeStatut avancement={m.avancementPublie} />
                  </div>
                  <Barre pourcent={m.avancementPublie} />
                </div>
              ))}
            </div>
          )
        })}

        <footer style={{ marginTop: 40, fontSize: 12, color: '#6E6E73', borderTop: '1px solid #ECE5DF', paddingTop: 16 }}>
          Seyssins Nature &amp; Solidaire — outil du groupe politique, indépendant des moyens municipaux. Données publiées
          et validées uniquement. Mentions légales et politique de protection des données disponibles sur demande.
        </footer>
      </div>
    </>
  )
}
