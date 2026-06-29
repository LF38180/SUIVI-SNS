import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'
import { audit } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const mesureId = Number(id)
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (typeof body.intitule === 'string') data.intitule = body.intitule
  if (typeof body.rubrique === 'string') data.rubrique = body.rubrique
  if (typeof body.besoins === 'string') data.besoins = body.besoins || null
  if (typeof body.limites === 'string') data.limites = body.limites || null
  if (typeof body.natureCout === 'string') data.natureCout = body.natureCout
  if (typeof body.ordreGrandeur === 'string') data.ordreGrandeur = body.ordreGrandeur
  if (typeof body.coutPublic === 'boolean') data.coutPublic = body.coutPublic
  if (typeof body.limitesPublic === 'boolean') data.limitesPublic = body.limitesPublic
  if ('eluReferentId' in body) data.eluReferentId = body.eluReferentId ? Number(body.eluReferentId) : null
  if ('adjointRattachementId' in body)
    data.adjointRattachementId = body.adjointRattachementId ? Number(body.adjointRattachementId) : null
  if ('echeanceCible' in body)
    data.echeanceCible = body.echeanceCible ? new Date(body.echeanceCible) : null

  // co-référents : si fournis, on remplace l'ensemble
  const coReferents: number[] | null = Array.isArray(body.coReferentIds)
    ? body.coReferentIds.map((x: unknown) => Number(x)).filter((n: number) => !Number.isNaN(n))
    : null

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length) {
      await tx.mesure.update({ where: { id: mesureId }, data })
    }
    if (coReferents) {
      await tx.mesureCoReferent.deleteMany({ where: { mesureId } })
      // on évite de mettre le référent principal en co-référent en doublon
      const refId = data.eluReferentId as number | null | undefined
      const distincts = [...new Set(coReferents)].filter((uid) => uid !== refId)
      if (distincts.length) {
        await tx.mesureCoReferent.createMany({
          data: distincts.map((userId) => ({ mesureId, userId })),
        })
      }
    }
  })

  const mesure = await prisma.mesure.findUnique({ where: { id: mesureId }, select: { intitule: true } })
  const acteur = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  await audit({
    auteurId: session.userId,
    auteurNom: acteur?.nom ?? 'Admin',
    action: 'mesure.edition',
    cible: `Mesure #${mesureId} — ${mesure?.intitule ?? ''}`,
  })

  return NextResponse.json({ ok: true })
}
