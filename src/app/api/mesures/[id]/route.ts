import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof body.intitule === 'string') data.intitule = body.intitule
  if (typeof body.eluReferentId === 'number') data.eluReferentId = body.eluReferentId
  if (typeof body.coutPublic === 'boolean') data.coutPublic = body.coutPublic
  if (typeof body.limitesPublic === 'boolean') data.limitesPublic = body.limitesPublic
  await prisma.mesure.update({ where: { id: Number(id) }, data })
  return NextResponse.json({ ok: true })
}
