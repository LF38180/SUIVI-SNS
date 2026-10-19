import { NextRequest, NextResponse } from 'next/server'
import { peutValider } from '@/lib/permissions'
import { exigerMoyensGenerauxApi, estReponse, cleValide } from '@/lib/moyens-generaux'
import { listerVersions } from '@/lib/documents-pole'

// GET /{cle}/versions           → versions de l'exemplaire de l'appelant
// GET /{cle}/versions?reference=1 → versions de la référence
// GET /{cle}/versions?userId=N   → versions de l'exemplaire d'un membre (ADMIN seul)
export async function GET(req: NextRequest, { params }: { params: Promise<{ cle: string }> }) {
  const session = await exigerMoyensGenerauxApi()
  if (estReponse(session)) return session
  const { cle } = await params
  if (!cleValide(cle)) return NextResponse.json({ erreur: 'Clé inconnue' }, { status: 400 })

  const sp = req.nextUrl.searchParams
  let cibleUserId: number | null = session.userId
  if (sp.get('reference') === '1') cibleUserId = null
  else if (sp.get('userId')) {
    if (!peutValider(session.role)) return NextResponse.json({ erreur: 'Accès refusé' }, { status: 403 })
    cibleUserId = Number(sp.get('userId'))
  }
  return NextResponse.json(await listerVersions(cle, cibleUserId))
}
