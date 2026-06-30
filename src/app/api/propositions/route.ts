import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutProposer } from '@/lib/permissions'
import { notifierAdmins } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutProposer(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { mesureId, avancementPropose, commentaire } = await req.json()
  const av = Math.max(0, Math.min(100, Math.round(Number(avancementPropose))))
  if (!mesureId || Number.isNaN(av)) {
    return NextResponse.json({ erreur: 'Données invalides' }, { status: 400 })
  }
  // La mesure doit exister et ne pas être supprimée (évite les propositions orphelines).
  const cible = await prisma.mesure.findFirst({ where: { id: Number(mesureId), deletedAt: null } })
  if (!cible) {
    return NextResponse.json({ erreur: 'Mesure introuvable' }, { status: 404 })
  }
  const prop = await prisma.proposition.create({
    data: {
      mesureId: Number(mesureId),
      auteurId: session.userId,
      avancementPropose: av,
      commentaire: commentaire ? String(commentaire) : null,
      statut: 'EN_ATTENTE',
    },
  })
  // entrée journal liée à la proposition (traçabilité interne)
  if (commentaire) {
    await prisma.journalEntree.create({
      data: {
        mesureId: Number(mesureId),
        auteurId: session.userId,
        commentaire: String(commentaire),
        avancementAssocie: av,
      },
    })
  }
  // notifier les admins qu'une proposition est à valider
  const mesure = await prisma.mesure.findUnique({ where: { id: Number(mesureId) }, select: { intitule: true } })
  const auteur = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  await notifierAdmins(
    `${auteur?.nom ?? 'Un élu'} propose ${av}% sur « ${mesure?.intitule ?? 'une mesure'} »`,
    `/admin/validations`,
  )

  return NextResponse.json({ ok: true, id: prop.id })
}
