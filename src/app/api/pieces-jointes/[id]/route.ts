import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { notifierUser } from '@/lib/notifications'
import { audit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

// Valider / refuser une pièce jointe (admin), ou la supprimer (admin ou auteur).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { action } = await req.json()
  const piece = await prisma.pieceJointe.findFirst({ where: { id: Number(id), deletedAt: null }, include: { mesure: true } })
  if (!piece) return NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })

  if (action === 'valider' || action === 'refuser') {
    const nouveau = action === 'valider' ? 'VALIDEE' : 'REFUSEE'
    // Verrou optimiste : ne traiter que si encore EN_ATTENTE (évite valider+refuser concurrents).
    const verrou = await prisma.pieceJointe.updateMany({
      where: { id: piece.id, statut: 'EN_ATTENTE' },
      data: { statut: nouveau },
    })
    if (verrou.count === 0) {
      return NextResponse.json({ erreur: 'Photo déjà traitée' }, { status: 409 })
    }
    const mot = action === 'valider' ? 'validée' : 'refusée'
    await notifierUser(piece.ajouteeParId, `Votre photo sur « ${piece.mesure.intitule} » a été ${mot}`, `/mesures/${piece.mesureId}`)
    if (action === 'valider') revalidatePath('/public')
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ erreur: 'Action inconnue' }, { status: 400 })
}

// Supprimer une pièce jointe : soft-delete réversible (corbeille), jamais physique.
// L'auteur peut retirer sa pièce EN_ATTENTE/REFUSEE ; une pièce déjà VALIDEE (publiée)
// ne peut être retirée que par un admin. Toute suppression est tracée dans l'audit.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const piece = await prisma.pieceJointe.findFirst({ where: { id: Number(id), deletedAt: null } })
  if (!piece) return NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })

  const estAdmin = peutValider(session.role)
  const estAuteur = piece.ajouteeParId === session.userId
  if (!estAdmin && !estAuteur) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 403 })
  }
  // Une pièce validée est publique : seul un admin peut la retirer.
  if (piece.statut === 'VALIDEE' && !estAdmin) {
    return NextResponse.json({ erreur: 'Une photo validée ne peut être retirée que par un administrateur' }, { status: 403 })
  }

  // Soft-delete : le blob reste en base, récupérable. Aucune perte de données.
  await prisma.pieceJointe.update({ where: { id: piece.id }, data: { deletedAt: new Date() } })

  const moi = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  await audit({
    auteurId: session.userId,
    auteurNom: moi?.nom ?? `#${session.userId}`,
    action: 'piece.suppression',
    cible: `pieceJointe#${piece.id} (mesure#${piece.mesureId})`,
    details: `statut=${piece.statut}`,
  })
  if (piece.statut === 'VALIDEE') revalidatePath('/public')
  return NextResponse.json({ ok: true })
}
