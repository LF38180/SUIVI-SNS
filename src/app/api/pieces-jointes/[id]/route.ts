import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { notifierUser } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'

// Valider / refuser une pièce jointe (admin), ou la supprimer (admin ou auteur).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { action } = await req.json()
  const piece = await prisma.pieceJointe.findUnique({ where: { id: Number(id) }, include: { mesure: true } })
  if (!piece) return NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })

  if (action === 'valider') {
    await prisma.pieceJointe.update({ where: { id: piece.id }, data: { statut: 'VALIDEE' } })
    await notifierUser(piece.ajouteeParId, `Votre photo sur « ${piece.mesure.intitule} » a été validée`, `/mesures/${piece.mesureId}`)
    revalidatePath('/public')
    return NextResponse.json({ ok: true })
  }
  if (action === 'refuser') {
    await prisma.pieceJointe.update({ where: { id: piece.id }, data: { statut: 'REFUSEE' } })
    await notifierUser(piece.ajouteeParId, `Votre photo sur « ${piece.mesure.intitule} » a été refusée`, `/mesures/${piece.mesureId}`)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ erreur: 'Action inconnue' }, { status: 400 })
}

// Supprimer une pièce jointe (admin, ou l'auteur de la pièce).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const piece = await prisma.pieceJointe.findUnique({ where: { id: Number(id) } })
  if (!piece) return NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })
  if (!peutValider(session.role) && piece.ajouteeParId !== session.userId) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 403 })
  }
  // le blob part en cascade (onDelete: Cascade)
  await prisma.pieceJointe.delete({ where: { id: piece.id } })
  return NextResponse.json({ ok: true })
}
