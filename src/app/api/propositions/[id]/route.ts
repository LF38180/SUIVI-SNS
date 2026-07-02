import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { calculerEffetValidation } from '@/lib/validation'
import { notifierUser, notifierTousSauf } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { action, motifRefus } = await req.json() // action: 'valider' | 'refuser'

  const prop = await prisma.proposition.findUnique({ where: { id: Number(id) }, include: { mesure: true } })
  if (!prop || prop.statut !== 'EN_ATTENTE') {
    return NextResponse.json({ erreur: 'Proposition introuvable ou déjà traitée' }, { status: 404 })
  }

  if (action === 'valider') {
    const effet = calculerEffetValidation({
      avancementPublie: prop.mesure.avancementPublie,
      avancementPropose: prop.avancementPropose,
    })
    try {
      await prisma.$transaction(async (tx) => {
        // Verrou optimiste : la 1re opération ne passe QUE si la proposition est encore
        // EN_ATTENTE. Deux admins (ou deux onglets) qui valident en même temps : le second
        // obtient count=0 → rollback → pas de double entrée Historique (append-only).
        const verrou = await tx.proposition.updateMany({
          where: { id: prop.id, statut: 'EN_ATTENTE' },
          data: { statut: 'VALIDEE', valideeParId: session.userId, traiteeLe: new Date() },
        })
        if (verrou.count === 0) throw new Error('DEJA_TRAITEE')
        await tx.mesure.update({
          where: { id: prop.mesureId },
          data: { avancementPublie: effet.nouveauAvancementPublie },
        })
        // Historique append-only (inaltérabilité §8.5)
        await tx.historique.create({
          data: {
            mesureId: prop.mesureId,
            ancienPourcent: effet.entreeHistorique.ancienPourcent,
            nouveauPourcent: effet.entreeHistorique.nouveauPourcent,
            proposeParId: prop.auteurId,
            valideeParId: session.userId,
          },
        })
      })
    } catch (e) {
      if (e instanceof Error && e.message === 'DEJA_TRAITEE') {
        return NextResponse.json({ erreur: 'Proposition déjà traitée' }, { status: 409 })
      }
      throw e
    }
    // notifs : l'auteur est informé, et les autres élus voient la mise à jour du collègue
    const lien = `/mesures/${prop.mesureId}`
    await notifierUser(prop.auteurId, `Votre proposition sur « ${prop.mesure.intitule} » a été validée (${effet.nouveauAvancementPublie}%)`, lien)
    await notifierTousSauf(prop.auteurId, `« ${prop.mesure.intitule} » est passé à ${effet.nouveauAvancementPublie}%`, lien)
    // régénère la vue publique mise en cache (la donnée publiée a changé).
    // La courbe (unstable_cache, revalidate 5 min) se rafraîchit d'elle-même.
    revalidatePath('/public')
    return NextResponse.json({ ok: true })
  }

  if (action === 'refuser') {
    // Même verrou optimiste que la validation : refus idempotent, pas d'écrasement
    // d'une proposition déjà validée par un autre admin en concurrence.
    const verrou = await prisma.proposition.updateMany({
      where: { id: prop.id, statut: 'EN_ATTENTE' },
      data: {
        statut: 'REFUSEE',
        motifRefus: motifRefus ? String(motifRefus) : null,
        valideeParId: session.userId,
        traiteeLe: new Date(),
      },
    })
    if (verrou.count === 0) {
      return NextResponse.json({ erreur: 'Proposition déjà traitée' }, { status: 409 })
    }
    await notifierUser(
      prop.auteurId,
      `Votre proposition sur « ${prop.mesure.intitule} » a été refusée${motifRefus ? ` : ${motifRefus}` : ''}`,
      `/mesures/${prop.mesureId}`,
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ erreur: 'Action inconnue' }, { status: 400 })
}
