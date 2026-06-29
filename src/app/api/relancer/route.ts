import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { notifierUser } from '@/lib/notifications'

// Relance un élu (notification in-app) sur ses mesures à mettre à jour.
export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { referentNom } = await req.json()
  if (!referentNom) return NextResponse.json({ erreur: 'Référent requis' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { nom: String(referentNom), actif: true } })
  if (!user) return NextResponse.json({ erreur: 'Élu introuvable' }, { status: 404 })

  await notifierUser(
    user.id,
    'Pensez à mettre à jour l’avancement de vos mesures 🙂',
    '/mes-mesures',
  )
  return NextResponse.json({ ok: true })
}
