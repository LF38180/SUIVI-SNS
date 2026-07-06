import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { audit } from '@/lib/audit'

// Édition des champs "terrain" d'une mesure par les élus RATTACHÉS (responsables ou
// concernés) — ou un admin : échéance, besoins, coût. Appliqué directement (pas de
// validation admin), mais tracé dans le journal de bord + l'audit.
// Ne touche PAS aux champs sensibles (référents, visibilité publique, situation) qui
// restent réservés à l'admin via /api/mesures/[id].
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const mesureId = Number(id)

  const mesure = await prisma.mesure.findFirst({
    where: { id: mesureId, deletedAt: null },
    select: {
      intitule: true, echeanceCible: true, besoins: true, natureCout: true, ordreGrandeur: true,
      responsables: { select: { userId: true } },
    },
  })
  if (!mesure) return NextResponse.json({ erreur: 'Mesure introuvable' }, { status: 404 })

  const estAdmin = peutValider(session.role)
  const estRattache = mesure.responsables.some((r) => r.userId === session.userId)
  if (!estAdmin && !estRattache) {
    return NextResponse.json({ erreur: 'Réservé aux élus en charge de cette mesure' }, { status: 403 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  const changements: string[] = []

  if ('echeanceCible' in body) {
    const nouvelle = body.echeanceCible ? new Date(body.echeanceCible) : null
    if (nouvelle && Number.isNaN(nouvelle.getTime())) {
      return NextResponse.json({ erreur: 'Échéance invalide' }, { status: 400 })
    }
    data.echeanceCible = nouvelle
    const avant = mesure.echeanceCible ? mesure.echeanceCible.toLocaleDateString('fr-FR') : 'aucune'
    const apres = nouvelle ? nouvelle.toLocaleDateString('fr-FR') : 'aucune'
    if (avant !== apres) changements.push(`échéance : ${avant} → ${apres}`)
  }
  if (typeof body.besoins === 'string') {
    const v = body.besoins.trim() || null
    data.besoins = v
    if ((mesure.besoins ?? '') !== (v ?? '')) changements.push('besoins mis à jour')
  }
  if (typeof body.natureCout === 'string' || typeof body.ordreGrandeur === 'string') {
    if (typeof body.natureCout === 'string') data.natureCout = body.natureCout.trim() || null
    if (typeof body.ordreGrandeur === 'string') data.ordreGrandeur = body.ordreGrandeur.trim() || null
    changements.push('coût mis à jour')
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ erreur: 'Rien à modifier' }, { status: 400 })
  }

  const moi = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })

  await prisma.$transaction(async (tx) => {
    await tx.mesure.update({ where: { id: mesureId }, data })
    // Trace dans le journal de bord (reporting) : qui a changé quoi, quand.
    if (changements.length) {
      await tx.journalEntree.create({
        data: {
          mesureId,
          auteurId: session.userId,
          commentaire: `Mise à jour du cadre — ${changements.join(' ; ')}`,
        },
      })
    }
  })

  await audit({
    auteurId: session.userId,
    auteurNom: moi?.nom ?? `#${session.userId}`,
    action: 'mesure.champs-elu',
    cible: `Mesure #${mesureId} — ${mesure.intitule}`,
    details: changements.join(' ; '),
  })

  return NextResponse.json({ ok: true })
}
