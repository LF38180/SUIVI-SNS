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
  if (['NORMALE', 'REPORTEE', 'ADAPTEE', 'ABANDONNEE'].includes(body.situation)) data.situation = body.situation
  if (typeof body.situationMotif === 'string') data.situationMotif = body.situationMotif || null
  if ('echeanceCible' in body)
    data.echeanceCible = body.echeanceCible ? new Date(body.echeanceCible) : null

  // Rattachements (modèle à plat) : si fournis, on remplace l'ensemble.
  const nettoie = (arr: unknown): number[] =>
    Array.isArray(arr) ? [...new Set(arr.map((x) => Number(x)).filter((n) => !Number.isNaN(n)))] : []
  const responsableIds = 'responsableIds' in body ? nettoie(body.responsableIds) : null
  const concerneIds = 'concerneIds' in body ? nettoie(body.concerneIds) : null

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length) {
      await tx.mesure.update({ where: { id: mesureId }, data })
    }
    if (responsableIds !== null || concerneIds !== null) {
      const resp = responsableIds ?? []
      // un élu responsable ne peut pas être aussi concerné (responsable l'emporte)
      const conc = (concerneIds ?? []).filter((uid) => !resp.includes(uid))
      await tx.mesureResponsable.deleteMany({ where: { mesureId } })
      const lignes = [
        ...resp.map((userId) => ({ mesureId, userId, role: 'RESPONSABLE' as const })),
        ...conc.map((userId) => ({ mesureId, userId, role: 'CONCERNE' as const })),
      ]
      if (lignes.length) await tx.mesureResponsable.createMany({ data: lignes })
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
