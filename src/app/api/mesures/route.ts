import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'

// Création d'une mesure (typiquement une "Initiative hors programme", §4.1).
export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const body = await req.json()
  const intitule = typeof body.intitule === 'string' ? body.intitule.trim() : ''
  if (!intitule) {
    return NextResponse.json({ erreur: 'Intitulé requis' }, { status: 400 })
  }
  const categorie = body.categorie === 'AXE_1' || body.categorie === 'AXE_2' || body.categorie === 'AXE_3' || body.categorie === 'AXE_4'
    ? body.categorie
    : 'HORS_PROGRAMME'

  // ordre = juste après la dernière mesure
  const max = await prisma.mesure.aggregate({ _max: { ordre: true } })
  const ordre = (max._max.ordre ?? 0) + 1

  const mesure = await prisma.mesure.create({
    data: {
      categorie,
      rubrique: typeof body.rubrique === 'string' && body.rubrique.trim() ? body.rubrique.trim() : 'Initiatives du mandat',
      intitule,
      natureCout: body.natureCout ?? 'À chiffrer',
      ordreGrandeur: body.ordreGrandeur ?? 'À chiffrer',
      avancementPublie: 0,
      ordre,
      eluReferentId: body.eluReferentId ? Number(body.eluReferentId) : null,
    },
  })
  return NextResponse.json({ ok: true, id: mesure.id })
}
