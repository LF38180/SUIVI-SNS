import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'

// Liste les notifications de l'utilisateur connecté (récentes d'abord).
export async function GET() {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })
  const notifs = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { creeeLe: 'desc' },
    take: 20,
  })
  const nonLues = await prisma.notification.count({ where: { userId: session.userId, lue: false } })
  return NextResponse.json({ notifs, nonLues })
}

// Marque toutes les notifications comme lues.
export async function PATCH() {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })
  await prisma.notification.updateMany({
    where: { userId: session.userId, lue: false },
    data: { lue: true },
  })
  return NextResponse.json({ ok: true })
}
