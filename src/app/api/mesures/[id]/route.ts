import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'
import { audit } from '@/lib/audit'
import { notifierUser } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const mesureId = Number(id)
  const body = await req.json()

  // Validation / refus d'une initiative hors programme proposée par un élu.
  if (body.action === 'valider' || body.action === 'refuser') {
    const cible = await prisma.mesure.findUnique({
      where: { id: mesureId },
      select: { intitule: true, statutMesure: true, proposeeParId: true },
    })
    if (!cible) return NextResponse.json({ erreur: 'Introuvable' }, { status: 404 })
    if (cible.statutMesure !== 'EN_ATTENTE') {
      return NextResponse.json({ erreur: 'Initiative déjà traitée' }, { status: 409 })
    }
    const nouveau = body.action === 'valider' ? 'VALIDEE' : 'REFUSEE'
    const verrou = await prisma.mesure.updateMany({
      where: { id: mesureId, statutMesure: 'EN_ATTENTE' },
      data: { statutMesure: nouveau, motifRefus: body.action === 'refuser' ? (body.motifRefus ? String(body.motifRefus) : null) : null },
    })
    if (verrou.count === 0) return NextResponse.json({ erreur: 'Initiative déjà traitée' }, { status: 409 })

    if (cible.proposeeParId) {
      const mot = body.action === 'valider'
        ? `Votre initiative « ${cible.intitule} » a été validée et est désormais publiée.`
        : `Votre initiative « ${cible.intitule} » n'a pas été retenue${body.motifRefus ? ` : ${body.motifRefus}` : ''}.`
      await notifierUser(cible.proposeeParId, mot, `/mesures/${mesureId}`)
    }
    const acteur = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
    await audit({
      auteurId: session.userId,
      auteurNom: acteur?.nom ?? 'Admin',
      action: `initiative.${body.action}`,
      cible: `Mesure #${mesureId} — ${cible.intitule}`,
    })
    if (body.action === 'valider') revalidatePath('/public')
    return NextResponse.json({ ok: true })
  }

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
