import { toutesLesMesures, moyenne, agregatsParAxe } from '@/lib/requetes'
import { prisma } from '@/lib/db'
import { Jauge } from '@/components/Jauge'
import { Barre } from '@/components/Barre'
import { EnTete } from '@/components/EnTete'
import { NOMS_AXES } from '@/lib/axes'
import { statutDe, STATUTS } from '@/lib/statut'
import { CourbeEvolution } from '@/components/CourbeEvolution'
import { reconstruireCourbe } from '@/lib/evolution'
import { BoutonImpression } from '@/components/BoutonImpression'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'

// La courbe ne change qu'à une validation admin. On la calcule au plus une fois
// toutes les 5 min (et l'invalidation par tag 'courbe' la régénère à la validation),
// au lieu de rejouer toute la table Historique à chaque visite.
const courbeCachee = unstable_cache(
  async () => {
    const mesures = await prisma.mesure.findMany({ where: { deletedAt: null }, select: { id: true, avancementPublie: true } })
    const histo = await prisma.historique.findMany({ orderBy: { date: 'asc' } })
    const actuels = new Map(mesures.map((m) => [m.id, m.avancementPublie]))
    return reconstruireCourbe(actuels, histo, mesures.length)
  },
  ['courbe-evolution'],
  { revalidate: 300 },
)

export default async function TableauDeBord() {
  const mesures = await toutesLesMesures()
  const global = moyenne(mesures.map((m) => m.avancementPublie))
  const axes = agregatsParAxe(mesures)
  const counts = STATUTS.map((s) => ({
    s,
    n: mesures.filter((m) => statutDe(m.avancementPublie).nom === s.nom).length,
  }))

  // Courbe d'évolution : moyenne globale reconstituée dans le temps (replay de l'historique)
  const points = await courbeCachee()

  return (
    <>
      <EnTete
        titre="Suivi du programme municipal 2026-2032"
        sousTitre="Là où nous en sommes, engagement par engagement."
      />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <section
          style={{
            marginTop: -34,
            position: 'relative',
            zIndex: 3,
          }}
          className="synth"
        >
          <div className="panel">
            <h2>Avancement global</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Jauge pourcent={global} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {counts.map(({ s, n }) => (
                  <div key={s.nom} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: s.couleur }} />
                    <b>{n}</b> {s.nom}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel">
            <h2>Avancement par axe</h2>
            <div className="axes-grid">
              {axes.map((a) => (
                <Link
                  key={a.axe}
                  href={`/mesures?axe=${a.axe}`}
                  style={{ border: '1px solid #ECE5DF', borderRadius: 14, padding: '14px 15px', textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EE6B3E', letterSpacing: '.5px' }}>
                      {a.axe.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 21, fontWeight: 800 }}>{a.pourcent}%</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 10px', minHeight: 34 }}>{NOMS_AXES[a.axe]}</div>
                  <Barre pourcent={a.pourcent} />
                  <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 7 }}>
                    {a.nb} mesures · {a.realisees} réalisée{a.realisees > 1 ? 's' : ''}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="panel" style={{ marginTop: 18 }}>
          <h2>Évolution</h2>
          <CourbeEvolution points={points} />
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10 }} className="no-print">
          <BoutonImpression />
          <a href="/api/export/csv" className="btn">
            Export CSV
          </a>
        </div>
      </div>
    </>
  )
}
