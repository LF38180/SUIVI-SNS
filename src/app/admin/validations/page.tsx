import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { FileValidation, PropVue } from '@/components/FileValidation'
import { FilePhotos, PhotoVue } from '@/components/FilePhotos'

export default async function PageValidations() {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')

  const props = await prisma.proposition.findMany({
    where: { statut: 'EN_ATTENTE' },
    include: { mesure: true, auteur: true },
    orderBy: { creeeLe: 'asc' },
  })
  const vues: PropVue[] = props.map((p) => ({
    id: p.id,
    mesureIntitule: p.mesure.intitule,
    auteur: p.auteur.nom,
    ancien: p.mesure.avancementPublie,
    propose: p.avancementPropose,
    commentaire: p.commentaire,
    depuisJours: Math.max(0, Math.floor((Date.now() - p.creeeLe.getTime()) / 86400000)),
  }))

  const piecesAttente = await prisma.pieceJointe.findMany({
    where: { statut: 'EN_ATTENTE' },
    include: { mesure: { select: { intitule: true } }, ajouteePar: { select: { nom: true } } },
    orderBy: { date: 'asc' },
  })
  const photos: PhotoVue[] = piecesAttente.map((p) => ({
    id: p.id,
    mesureIntitule: p.mesure.intitule,
    auteur: p.ajouteePar.nom,
    type: p.type,
  }))

  const total = vues.length + photos.length

  return (
    <>
      <EnTete titre="À valider" sousTitre={`${total} en attente`} />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <FileValidation propositions={vues} />
        <FilePhotos photos={photos} />
      </div>
    </>
  )
}
