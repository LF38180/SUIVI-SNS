import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { hashMotDePasse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { nom, email, role, motDePasse } = await req.json()
  if (!nom || !email || !motDePasse) {
    return NextResponse.json({ erreur: 'Champs requis' }, { status: 400 })
  }
  const existe = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (existe) {
    return NextResponse.json({ erreur: 'Email déjà utilisé' }, { status: 409 })
  }
  const hash = await hashMotDePasse(String(motDePasse))
  const u = await prisma.user.create({
    data: {
      nom: String(nom),
      email: String(email).toLowerCase(),
      role: role === 'ADMIN' ? 'ADMIN' : 'ELU',
      motDePasseHash: hash,
    },
  })
  return NextResponse.json({ ok: true, id: u.id })
}

export async function PATCH(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id, actif } = await req.json()
  await prisma.user.update({ where: { id: Number(id) }, data: { actif: Boolean(actif) } })
  return NextResponse.json({ ok: true })
}
