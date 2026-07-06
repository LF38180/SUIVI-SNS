import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures, peutProposer } from '@/lib/permissions'
import { notifierAdmins } from '@/lib/notifications'

// Création d'une mesure.
// - Admin : crée directement une mesure VALIDEE (peut choisir la catégorie).
// - Élu : propose une INITIATIVE hors programme → créée EN_ATTENTE de validation
//   admin, avec l'élu comme responsable et proposeeParId renseigné.
export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutProposer(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const estAdmin = peutGererMesures(session.role)

  const body = await req.json()
  const intitule = typeof body.intitule === 'string' ? body.intitule.trim() : ''
  if (!intitule) {
    return NextResponse.json({ erreur: 'Intitulé requis' }, { status: 400 })
  }
  // Un élu ne crée QUE du hors programme. L'admin peut placer où il veut.
  const categorie = estAdmin && ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4'].includes(body.categorie)
    ? body.categorie
    : 'HORS_PROGRAMME'

  // ordre = juste après la dernière mesure
  const max = await prisma.mesure.aggregate({ _max: { ordre: true } })
  const ordre = (max._max.ordre ?? 0) + 1

  if (estAdmin) {
    const responsableId = body.eluReferentId ? Number(body.eluReferentId) : null
    const mesure = await prisma.mesure.create({
      data: {
        categorie,
        rubrique: typeof body.rubrique === 'string' && body.rubrique.trim() ? body.rubrique.trim() : 'Initiatives du mandat',
        intitule,
        natureCout: body.natureCout ?? 'À chiffrer',
        ordreGrandeur: body.ordreGrandeur ?? 'À chiffrer',
        avancementPublie: 0,
        ordre,
        statutMesure: 'VALIDEE',
        responsables: responsableId ? { create: { userId: responsableId, role: 'RESPONSABLE' } } : undefined,
      },
    })
    return NextResponse.json({ ok: true, id: mesure.id })
  }

  // Élu : initiative hors programme EN ATTENTE, rattachée à lui, notifie les admins.
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const mesure = await prisma.mesure.create({
    data: {
      categorie: 'HORS_PROGRAMME',
      rubrique: 'Initiatives du mandat',
      intitule,
      besoins: description || null,
      natureCout: 'À chiffrer',
      ordreGrandeur: 'À chiffrer',
      avancementPublie: 0,
      ordre,
      statutMesure: 'EN_ATTENTE',
      proposeeParId: session.userId,
      responsables: { create: { userId: session.userId, role: 'RESPONSABLE' } },
    },
  })
  const moi = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  await notifierAdmins(
    `${moi?.nom ?? 'Un élu'} propose une initiative hors programme : « ${intitule} »`,
    '/admin/validations',
  )
  return NextResponse.json({ ok: true, id: mesure.id })
}
