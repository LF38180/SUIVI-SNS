import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { NOMS_AXES } from '@/lib/axes'
import { FormNouvelleMesure } from '@/components/FormNouvelleMesure'
import Link from 'next/link'

const ORDRE_AXES = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4', 'HORS_PROGRAMME']

export default async function AdminMesures() {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) redirect('/')
  const mesures = await prisma.mesure.findMany({
    orderBy: { ordre: 'asc' },
    include: { eluReferent: true, adjointRattachement: true, coReferents: { include: { user: true } } },
  })

  // numéro continu 1..N attribué dans l'ordre d'affichage
  let numero = 0

  function elusDe(m: (typeof mesures)[number]): string {
    const noms: string[] = []
    if (m.eluReferent) noms.push(m.eluReferent.nom)
    if (m.adjointRattachement) noms.push(m.adjointRattachement.nom)
    m.coReferents.forEach((c) => noms.push(c.user.nom))
    return noms.length ? [...new Set(noms)].join(', ') : '—'
  }

  return (
    <>
      <EnTete titre="Gérer les mesures" sousTitre={`${mesures.length} mesures`} />
      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <FormNouvelleMesure />
        {ORDRE_AXES.map((axe) => {
          const ms = mesures.filter((m) => m.categorie === axe)
          if (!ms.length) return null
          // sous-groupes par rubrique, en gardant l'ordre
          const rubriques: string[] = [...new Set(ms.map((m) => m.rubrique))]
          return (
            <div key={axe} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 8px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#EE6B3E', padding: '4px 10px', borderRadius: 6 }}>
                  {axe.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{NOMS_AXES[axe]}</span>
              </div>
              {rubriques.map((rub) => (
                <div key={rub} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#EE6B3E', margin: '12px 0 4px' }}>{rub}</div>
                  {ms
                    .filter((m) => m.rubrique === rub)
                    .map((m) => {
                      numero += 1
                      return (
                        <Link key={m.id} href={`/admin/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #ECE5DF', fontSize: 13, alignItems: 'center' }}>
                            <span style={{ width: 28, color: '#9A9AA0', fontWeight: 700, textAlign: 'right' }}>{numero}</span>
                            <span style={{ flex: 1 }}>{m.intitule}</span>
                            <span style={{ color: '#6E6E73', width: 220, fontSize: 12 }}>{elusDe(m)}</span>
                            <span style={{ width: 45, textAlign: 'right' }}>{m.avancementPublie}%</span>
                            <span style={{ color: '#EE6B3E', fontSize: 12 }}>Modifier →</span>
                          </div>
                        </Link>
                      )
                    })}
                </div>
              ))}
            </div>
          )
        })}
        <p style={{ color: '#6E6E73', fontSize: 12, marginTop: 16 }}>
          Cliquez une mesure pour modifier : référent, co-référents, besoins, limites, échéance, visibilité publique.
        </p>
      </div>
    </>
  )
}
