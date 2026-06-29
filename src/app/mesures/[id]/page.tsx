import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import { FormProposition } from '@/components/FormProposition'
import { lireSession } from '@/lib/session'
import { peutProposer } from '@/lib/permissions'

export default async function FicheMesure({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mesure = await prisma.mesure.findUnique({
    where: { id: Number(id) },
    include: {
      eluReferent: true,
      adjointRattachement: true,
      journalEntrees: { include: { auteur: true }, orderBy: { date: 'desc' } },
      historique: { orderBy: { date: 'asc' } },
    },
  })
  if (!mesure) notFound()
  const session = await lireSession()

  return (
    <>
      <EnTete titre={mesure.intitule} sousTitre={mesure.rubrique} />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 22px 80px' }}>
        <div className="panel" style={{ marginTop: -34, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            <BadgeStatut avancement={mesure.avancementPublie} />
            {mesure.eluReferent && (
              <span style={{ fontSize: 12 }}>
                Référent : <b>{mesure.eluReferent.nom}</b>
              </span>
            )}
            {mesure.adjointRattachement && (
              <span style={{ fontSize: 12, color: '#6E6E73' }}>sous {mesure.adjointRattachement.nom}</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Avancement publié</span>
            <b>{mesure.avancementPublie}%</b>
          </div>
          <Barre pourcent={mesure.avancementPublie} />
          <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 10 }}>
            Coût : {mesure.natureCout} · {mesure.ordreGrandeur}
          </div>
        </div>

        {session && peutProposer(session.role) && (
          <FormProposition mesureId={mesure.id} avancementActuel={mesure.avancementPublie} />
        )}

        <div className="panel" style={{ marginTop: 18 }}>
          <h2>Journal de bord</h2>
          {mesure.journalEntrees.length === 0 && (
            <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune entrée.</div>
          )}
          {mesure.journalEntrees.map((j) => (
            <div key={j.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
              <b>{j.auteur.nom}</b>{' '}
              <span style={{ color: '#6E6E73' }}>· {j.date.toLocaleDateString('fr-FR')}</span>
              <div>{j.commentaire}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
