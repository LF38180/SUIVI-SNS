import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'
import { exigerMoyensGenerauxApi, estReponse, cleValide } from '@/lib/moyens-generaux'
import { publierReference } from '@/lib/documents-pole'

// PUT /{cle}/publier → copie l'exemplaire de l'appelant dans la référence. ADMIN seul.
export async function PUT(_req: Request, { params }: { params: Promise<{ cle: string }> }) {
  const session = await exigerMoyensGenerauxApi()
  if (estReponse(session)) return session
  if (!peutValider(session.role)) return NextResponse.json({ erreur: 'Réservé à l’administrateur' }, { status: 403 })
  const { cle } = await params
  if (!cleValide(cle)) return NextResponse.json({ erreur: 'Clé inconnue' }, { status: 400 })

  const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  const r = await publierReference(cle, session.userId, u?.nom ?? `#${session.userId}`)
  if (!r) return NextResponse.json({ erreur: 'Aucun exemplaire à publier' }, { status: 404 })
  return NextResponse.json(r)
}
