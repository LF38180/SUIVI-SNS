import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { INCLUDE_RESPONSABLES, separerRoles, moyenne, agregatsParAxe } from '@/lib/requetes'
import { NOMS_AXES } from '@/lib/axes'
import { statutDe, STATUTS } from '@/lib/statut'
import { Jauge } from '@/components/Jauge'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import { CourbeEvolution } from '@/components/CourbeEvolution'
import { genererDemoMesure, genererCourbeDemo } from '@/lib/demo'
import Link from 'next/link'

// Force le rendu dynamique (session) et interdit toute mise en cache : la démo est
// calculée à chaque visite, en mémoire, sans écrire en base.
export const dynamic = 'force-dynamic'

const LIBELLE_SITUATION: Record<string, string> = {
  REPORTEE: 'Reportée',
  ADAPTEE: 'Adaptée',
  ABANDONNEE: 'Abandonnée',
}

export default async function PageDemo() {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')

  // Vraies mesures (intitulés, axes, responsables) — lecture seule.
  const mesures = await prisma.mesure.findMany({
    where: { deletedAt: null },
    orderBy: { ordre: 'asc' },
    include: INCLUDE_RESPONSABLES,
  })

  // Données démo déterministes, générées en mémoire (aucune écriture).
  const demo = mesures.map((m) => {
    const { responsables, concernes } = separerRoles(m.responsables)
    const noms = [...responsables, ...concernes].map((u) => u.nom)
    return { m, noms, resp: responsables, conc: concernes, d: genererDemoMesure(m.id, noms) }
  })

  const programme = demo.filter((x) => x.m.categorie !== 'HORS_PROGRAMME')
  const avancements = programme.map((x) => x.d.avancement)
  const global = moyenne(avancements)
  const axes = agregatsParAxe(programme.map((x) => ({ categorie: x.m.categorie, avancementPublie: x.d.avancement })))
  const counts = STATUTS.map((s) => ({
    s,
    n: programme.filter((x) => statutDe(x.d.avancement).nom === s.nom).length,
  }))
  const courbe = genererCourbeDemo(avancements)

  // Quelques fiches mises en avant pour montrer le journal de bord (les plus « riches »).
  const vedettes = [...demo].sort((a, b) => b.d.journal.length - a.d.journal.length).slice(0, 4)

  return (
    <>
      {/* Bandeau MODE DÉMO bien visible */}
      <div style={{ background: '#232326', color: '#fff', padding: '10px 22px', fontSize: 13, textAlign: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        🎬 <b>MODE DÉMONSTRATION</b> — données fictives (avancements, journaux, situations). La vraie base n’est pas modifiée.{' '}
        <Link href="/admin" style={{ color: '#EE9B7E', textDecoration: 'underline' }}>Quitter la démo</Link>
      </div>

      <header style={{ background: 'var(--orange)', color: '#fff', padding: '30px 22px 46px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, opacity: 0.9, letterSpacing: '.5px' }}>DÉMONSTRATION · Seyssins Nature &amp; Solidaire</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>Suivi du programme municipal 2026-2032</h1>
          <div style={{ fontSize: 14, opacity: 0.92, marginTop: 4 }}>Exemple de ce à quoi ressemblera l’outil en cours de mandat.</div>
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

        {/* Exemples de fiches avec journal de bord (le cœur du reporting) */}
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#5a5a5f', margin: '30px 0 12px' }}>
          Exemples de suivi détaillé (journal de bord)
        </h2>
        {vedettes.map(({ m, resp, conc, d }) => (
          <div key={m.id} className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{m.intitule}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BadgeStatut avancement={d.avancement} />
                <b style={{ color: '#C0461F' }}>{d.avancement}%</b>
              </div>
            </div>
            <div style={{ marginTop: 8 }}><Barre pourcent={d.avancement} /></div>
            <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 8 }}>
              {resp.length > 1 ? 'Responsables : ' : 'Responsable : '}
              <b>{resp.map((u) => u.nom).join(', ') || 'à définir'}</b>
              {conc.length > 0 && <span> · avec {conc.map((u) => u.nom).join(', ')}</span>}
              {d.situation !== 'NORMALE' && <span style={{ color: '#C0461F', fontWeight: 600 }}> · {LIBELLE_SITUATION[d.situation]}</span>}
            </div>

            <div style={{ marginTop: 12, borderTop: '1px solid #ECE5DF', paddingTop: 10 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#5a5a5f', fontWeight: 700, marginBottom: 8 }}>Journal de bord</div>
              {[...d.journal].reverse().map((j, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', fontSize: 13 }}>
                  <span style={{ color: '#9A9AA0', minWidth: 88, fontSize: 12 }}>{j.date.toLocaleDateString('fr-FR')}</span>
                  <span style={{ flex: 1 }}>
                    {j.texte}
                    <span style={{ color: '#6E6E73' }}> — {j.auteur}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/admin" className="btn">← Revenir à mon espace admin</Link>
        </div>
      </div>
    </>
  )
}
