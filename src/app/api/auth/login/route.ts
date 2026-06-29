import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifierMotDePasse } from '@/lib/auth'
import { creerSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, motDePasse } = await req.json()
  if (!email || !motDePasse) {
    return NextResponse.json({ erreur: 'Champs requis' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (!user || !user.actif || !(await verifierMotDePasse(motDePasse, user.motDePasseHash))) {
    return NextResponse.json({ erreur: 'Identifiants invalides' }, { status: 401 })
  }
  await creerSession({ userId: user.id, role: user.role })
  return NextResponse.json({ ok: true, role: user.role })
}
