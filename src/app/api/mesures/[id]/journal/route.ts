import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'

// Journal de bord — outil de reporting. Un élu rattaché (ou un admin) saisit une
// action réalisée + sa date : elle apparaît immédiatement (SANS validation), pour
// documenter ce qui a été fait et justifier l'avancement.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const mesureId = Number(id)

  const mesure = await prisma.mesure.findFirst({
    where: { id: mesureId, deletedAt: null },
    select: { responsables: { select: { userId: true } }, proposeeParId: true },
  })
  if (!mesure) return NextResponse.json({ erreur: 'Mesure introuvable' }, { status: 404 })

  const estAdmin = peutValider(session.role)
  const estRattache = mesure.responsables.some((r) => r.userId === session.userId) || mesure.proposeeParId === session.userId
  if (!estAdmin && !estRattache) {
    return NextResponse.json({ erreur: 'Réservé aux élus en charge de cette mesure' }, { status: 403 })
  }

  const body = await req.json()
  const texte = typeof body.commentaire === 'string' ? body.commentaire.trim() : ''
  if (!texte) return NextResponse.json({ erreur: 'Décrivez l’action réalisée' }, { status: 400 })

  // Date de l'action : fournie par l'élu (jour où l'action a eu lieu) ou aujourd'hui.
  let date: Date | undefined
  if (body.date) {
    const d = new Date(body.date)
    if (Number.isNaN(d.getTime())) return NextResponse.json({ erreur: 'Date invalide' }, { status: 400 })
    date = d
  }

  await prisma.journalEntree.create({
    data: {
      mesureId,
      auteurId: session.userId,
      commentaire: texte,
      ...(date ? { date } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
