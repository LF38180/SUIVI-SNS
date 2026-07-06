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
  // La mesure doit exister, ne pas être supprimée, ET être validée : on n'accepte pas
  // de proposition d'avancement sur une initiative encore EN_ATTENTE (sinon son
  // historique remonterait dans le fil public avant même sa validation).
  const cible = await prisma.mesure.findFirst({ where: { id: Number(mesureId), deletedAt: null, statutMesure: 'VALIDEE' } })
  if (!cible) {
    return NextResponse.json({ erreur: 'Mesure introuvable ou non validée' }, { status: 404 })
  }
  // Proposition + entrée journal écrites dans UNE transaction : soit les deux, soit
  // aucune. Évite qu'un incident entre les deux écritures laisse un journal incomplet.
  const prop = await prisma.$transaction(async (tx) => {
    const p = await tx.proposition.create({
      data: {
        mesureId: Number(mesureId),
        auteurId: session.userId,
        avancementPropose: av,
        commentaire: commentaire ? String(commentaire) : null,
        statut: 'EN_ATTENTE',
      },
    })
    if (commentaire) {
      await tx.journalEntree.create({
        data: {
          mesureId: Number(mesureId),
          auteurId: session.userId,
          commentaire: String(commentaire),
          avancementAssocie: av,
        },
      })
    }
    return p
  })
  // notifier les admins qu'une proposition est à valider
  const mesure = await prisma.mesure.findUnique({ where: { id: Number(mesureId) }, select: { intitule: true } })
  const auteur = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  await notifierAdmins(
    `${auteur?.nom ?? 'Un élu'} propose ${av}% sur « ${mesure?.intitule ?? 'une mesure'} »`,
    `/admin/validations`,
  )

  return NextResponse.json({ ok: true, id: prop.id })
}
