import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { mesuresAvecEcheance } from '@/lib/requetes'
import { Barre } from '@/components/Barre'
import Link from 'next/link'

export default async function PageEcheances() {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')
  const mesures = await mesuresAvecEcheance()
  const enRetard = mesures.filter((m) => m.enRetard)

  return (
    <>
      <EnTete titre="Échéancier" sousTitre={`${mesures.length} mesures avec une date cible · ${enRetard.length} en retard`} />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        {mesures.length === 0 && (
          <div className="panel" style={{ color: '#6E6E73', fontSize: 14 }}>
            Aucune mesure n’a encore d’échéance cible. Renseignez les dates depuis « Gérer les mesures ».
          </div>
        )}
        {mesures.map((m) => (
          <Link key={m.id} href={`/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ borderLeft: m.enRetard ? '4px solid #C0461F' : '4px solid #ECE5DF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }}>{m.intitule}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.enRetard ? '#C0461F' : '#6E6E73' }}>
                  {new Date(m.echeance).toLocaleDateString('fr-FR')}
                  {m.enRetard && ' ⚠'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#6E6E73', margin: '6px 0' }}>
                {m.referent ?? 'Sans référent'} · {m.avancementPublie}%
              </div>
              <Barre pourcent={m.avancementPublie} />
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
