import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'
import { exigerMoyensGenerauxApi, estReponse, cleValide, GROUPE } from '@/lib/moyens-generaux'

// GET /{cle}/versions/{n} → contenu d'une version précise (même règle d'accès que le doc).
export async function GET(req: NextRequest, { params }: { params: Promise<{ cle: string; n: string }> }) {
  const session = await exigerMoyensGenerauxApi()
  if (estReponse(session)) return session
  const { cle, n } = await params
  if (!cleValide(cle)) return NextResponse.json({ erreur: 'Clé inconnue' }, { status: 400 })

  const sp = req.nextUrl.searchParams
  let cibleUserId: number | null = session.userId
  if (sp.get('reference') === '1') cibleUserId = null
  else if (sp.get('userId')) {
    if (!peutValider(session.role)) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })
    cibleUserId = Number(sp.get('userId'))
  }

  const doc = await prisma.documentPole.findFirst({
    where: { groupe: GROUPE, cle, userId: cibleUserId },
    select: { id: true },
  })
  if (!doc) return NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })
  const v = await prisma.documentPoleVersion.findUnique({
    where: { documentId_version: { documentId: doc.id, version: Number(n) } },
    select: { version: true, contenu: true, auteur: true, creeLe: true },
  })
  return v ? NextResponse.json(v) : NextResponse.json({ erreur: 'Version introuvable' }, { status: 404 })
}
