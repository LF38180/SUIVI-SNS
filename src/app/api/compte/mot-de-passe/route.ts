import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { hashMotDePasse, verifierMotDePasse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const { ancien, nouveau } = await req.json()
  if (!ancien || !nouveau) {
    return NextResponse.json({ erreur: 'Champs requis' }, { status: 400 })
  }
  if (String(nouveau).length < 8) {
    return NextResponse.json({ erreur: 'Le nouveau mot de passe doit faire au moins 8 caractères' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user || !(await verifierMotDePasse(ancien, user.motDePasseHash))) {
    return NextResponse.json({ erreur: 'Mot de passe actuel incorrect' }, { status: 403 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { motDePasseHash: await hashMotDePasse(String(nouveau)) },
  })
  return NextResponse.json({ ok: true })
}
