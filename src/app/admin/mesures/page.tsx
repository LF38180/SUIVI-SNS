import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'

export default async function AdminMesures() {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) redirect('/')
  const mesures = await prisma.mesure.findMany({ orderBy: { ordre: 'asc' }, include: { eluReferent: true } })
  return (
    <>
      <EnTete titre="Gérer les mesures" sousTitre={`${mesures.length} mesures`} />
      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 22px 80px' }}>
        {mesures.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #ECE5DF', fontSize: 13 }}>
            <span style={{ width: 70, color: '#EE6B3E', fontWeight: 600 }}>{m.categorie.replace('_', ' ')}</span>
            <span style={{ flex: 1 }}>{m.intitule}</span>
            <span style={{ color: '#6E6E73', width: 160 }}>{m.eluReferent?.nom ?? '—'}</span>
            <span style={{ width: 50, textAlign: 'right' }}>{m.avancementPublie}%</span>
          </div>
        ))}
        <p style={{ color: '#6E6E73', fontSize: 12, marginTop: 16 }}>
          Édition fine (changer référent, visibilité publique des champs coût/limites, ajout / fusion / scission de
          mesures) : prévue en phase 2 via l’API <code>PATCH /api/mesures/[id]</code>.
        </p>
      </div>
    </>
  )
}
