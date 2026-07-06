import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { moyenne, agregatsParAxe, depuis } from '@/lib/requetes'
import { NOMS_AXES } from '@/lib/axes'
import { statutDe, STATUTS } from '@/lib/statut'
import { Jauge } from '@/components/Jauge'
import { Barre } from '@/components/Barre'
import { CourbeEvolution } from '@/components/CourbeEvolution'
import { ListeMesures, MesureVue } from '@/components/ListeMesures'
import { chargerDemo, genererCourbeDemo } from '@/lib/demo'
import { BandeauDemo } from '@/components/BandeauDemo'
import Link from 'next/link'

// Rendu dynamique, jamais en cache : la démo est calculée en mémoire, sans écrire en base.
export const dynamic = 'force-dynamic'

export default async function PageDemo() {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')

  const demo = await chargerDemo()

  const programme = demo.filter((x) => x.m.categorie !== 'HORS_PROGRAMME')
  const avancements = programme.map((x) => x.d.avancement)
  const global = moyenne(avancements)
  const axes = agregatsParAxe(programme.map((x) => ({ categorie: x.m.categorie, avancementPublie: x.d.avancement })))
  const counts = STATUTS.map((s) => ({
    s,
    n: programme.filter((x) => statutDe(x.d.avancement).nom === s.nom).length,
  }))
  const courbe = genererCourbeDemo(avancements)

  // Liste cliquable — chaque carte mène à /demo/mesures/[id]
  const vues: MesureVue[] = demo.map((x) => ({
    id: x.m.id,
    categorie: x.m.categorie,
    rubrique: x.m.rubrique,
    intitule: x.m.intitule,
    avancementPublie: x.d.avancement,
    referent: x.resp[0]?.nom ?? null,
    elus: [...x.resp, ...x.conc].map((u) => u.nom),
    natureCout: x.m.natureCout,
    ordreGrandeur: x.m.ordreGrandeur,
    echeanceCible: null,
    majDepuis: depuis(x.d.derniereMaj),
  }))
  const referents = [...new Set(vues.flatMap((v) => v.elus))].sort()

  return (
    <>
      <BandeauDemo />

      <header style={{ background: 'var(--orange)', color: '#fff', padding: '30px 22px 46px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, opacity: 0.9, letterSpacing: '.5px' }}>DÉMONSTRATION · Seyssins Nature &amp; Solidaire</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>Suivi du programme municipal 2026-2032</h1>
          <div style={{ fontSize: 14, opacity: 0.92, marginTop: 4 }}>Cliquez n’importe quelle mesure pour voir son détail et son journal de bord.</div>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <section style={{ marginTop: -34, position: 'relative', zIndex: 3 }} className="synth">
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
                <div key={a.axe} style={{ border: '1px solid #ECE5DF', borderRadius: 14, padding: '14px 15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EE6B3E', letterSpacing: '.5px' }}>{a.axe.replace('_', ' ')}</span>
                    <span style={{ fontSize: 21, fontWeight: 800 }}>{a.pourcent}%</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 10px', minHeight: 34 }}>{NOMS_AXES[a.axe]}</div>
                  <Barre pourcent={a.pourcent} />
                  <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 7 }}>
                    {a.nb} mesures · {a.realisees} réalisée{a.realisees > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="panel" style={{ marginTop: 18 }}>
          <h2>Évolution depuis le début du mandat</h2>
          <CourbeEvolution points={courbe} />
        </div>

        {/* Liste complète, cliquable → fiche démo */}
        <ListeMesures mesures={vues} referents={referents} basePath="/demo/mesures" />

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/admin" className="btn">← Revenir à mon espace admin</Link>
        </div>
      </div>
    </>
  )
}
