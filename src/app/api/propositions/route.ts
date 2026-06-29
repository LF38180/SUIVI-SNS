import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutProposer } from '@/lib/permissions'

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
  return NextResponse.json({ ok: true, id: prop.id })
}
