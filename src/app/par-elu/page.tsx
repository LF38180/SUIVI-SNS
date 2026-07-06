import { toutesLesMesures, moyenne } from '@/lib/requetes'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import Link from 'next/link'

type Mesure = Awaited<ReturnType<typeof toutesLesMesures>>[number]

export default async function ParElu() {
  const mesures = await toutesLesMesures()
  // Une mesure apparaît chez chacun de ses élus rattachés (responsable OU concerné).
  const groupes = new Map<string, Mesure[]>()
  for (const m of mesures) {
    for (const r of m.responsables) {
      const nom = r.user.nom
      if (!groupes.has(nom)) groupes.set(nom, [])
      groupes.get(nom)!.push(m)
    }
  }
  const tries = [...groupes.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <>
      <EnTete titre="Suivi par élu" sousTitre="Ce que chaque élu porte ou suit, et où il en est." />
      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 22px 80px' }}>
        {tries.map(([nom, ms]) => (
          <div key={nom} className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ textTransform: 'none', fontSize: 16, color: '#232326' }}>{nom}</h2>
              <span style={{ fontSize: 13, color: '#6E6E73' }}>
                {moyenne(ms.map((m) => m.avancementPublie))}% · {ms.length} mesures
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              {ms.map((m) => (
                <Link key={m.id} href={`/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #ECE5DF' }}>
                    <BadgeStatut avancement={m.avancementPublie} />
                    <span style={{ flex: 1, fontSize: 13 }}>{m.intitule}</span>
                    <span style={{ width: 120 }}>
                      <Barre pourcent={m.avancementPublie} />
                    </span>
                    <b style={{ fontSize: 13, width: 40, textAlign: 'right' }}>{m.avancementPublie}%</b>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
