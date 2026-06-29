import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { FormEditionMesure } from '@/components/FormEditionMesure'
import Link from 'next/link'

export default async function EditionMesure({ params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) redirect('/')
  const { id } = await params
  const mesure = await prisma.mesure.findUnique({
    where: { id: Number(id) },
    include: { coReferents: true },
  })
  if (!mesure) notFound()
  const users = await prisma.user.findMany({ where: { actif: true }, orderBy: { nom: 'asc' }, select: { id: true, nom: true } })

  const vue = {
    id: mesure.id,
    intitule: mesure.intitule,
    rubrique: mesure.rubrique,
    besoins: mesure.besoins ?? '',
    limites: mesure.limites ?? '',
    natureCout: mesure.natureCout ?? '',
    ordreGrandeur: mesure.ordreGrandeur ?? '',
    echeanceCible: mesure.echeanceCible ? mesure.echeanceCible.toISOString().slice(0, 10) : '',
    eluReferentId: mesure.eluReferentId,
    adjointRattachementId: mesure.adjointRattachementId,
    coReferentIds: mesure.coReferents.map((c) => c.userId),
    coutPublic: mesure.coutPublic,
    limitesPublic: mesure.limitesPublic,
  }

  return (
    <>
      <EnTete titre="Modifier une mesure" sousTitre={mesure.intitule} />
      <div style={{ maxWidth: 720, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <div style={{ marginBottom: 12, fontSize: 13 }}>
          <Link href="/admin/mesures" style={{ color: '#EE6B3E' }}>← Retour à la liste des mesures</Link>
        </div>
        <FormEditionMesure mesure={vue} users={users} />
      </div>
    </>
  )
}
