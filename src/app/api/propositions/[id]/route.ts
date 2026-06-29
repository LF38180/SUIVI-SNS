import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { calculerEffetValidation } from '@/lib/validation'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { action, motifRefus } = await req.json() // action: 'valider' | 'refuser'

  const prop = await prisma.proposition.findUnique({ where: { id: Number(id) }, include: { mesure: true } })
  if (!prop || prop.statut !== 'EN_ATTENTE') {
    return NextResponse.json({ erreur: 'Proposition introuvable ou déjà traitée' }, { status: 404 })
  }

  if (action === 'valider') {
    const effet = calculerEffetValidation({
      avancementPublie: prop.mesure.avancementPublie,
      avancementPropose: prop.avancementPropose,
    })
    await prisma.$transaction([
      prisma.mesure.update({
        where: { id: prop.mesureId },
        data: { avancementPublie: effet.nouveauAvancementPublie },
      }),
      // Historique append-only (inaltérabilité §8.5)
      prisma.historique.create({
        data: {
          mesureId: prop.mesureId,
          ancienPourcent: effet.entreeHistorique.ancienPourcent,
          nouveauPourcent: effet.entreeHistorique.nouveauPourcent,
          proposeParId: prop.auteurId,
          valideeParId: session.userId,
        },
      }),
      prisma.proposition.update({
        where: { id: prop.id },
        data: { statut: 'VALIDEE', valideeParId: session.userId, traiteeLe: new Date() },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (action === 'refuser') {
    await prisma.proposition.update({
      where: { id: prop.id },
      data: {
        statut: 'REFUSEE',
        motifRefus: motifRefus ? String(motifRefus) : null,
        valideeParId: session.userId,
        traiteeLe: new Date(),
      },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ erreur: 'Action inconnue' }, { status: 400 })
}
