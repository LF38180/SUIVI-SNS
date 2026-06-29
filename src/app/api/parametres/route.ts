import { NextRequest, NextResponse } from 'next/server'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { ecrireParametre } from '@/lib/parametres'
import { audit } from '@/lib/audit'
import { prisma } from '@/lib/db'

const CLES_AUTORISEES = ['partage_public_autorise']

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { cle, valeur } = await req.json()
  if (!CLES_AUTORISEES.includes(cle)) {
    return NextResponse.json({ erreur: 'Paramètre inconnu' }, { status: 400 })
  }
  await ecrireParametre(String(cle), String(valeur))
  const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  await audit({ auteurId: session.userId, auteurNom: u?.nom ?? 'Admin', action: 'parametre.modification', cible: `${cle} = ${valeur}` })
  return NextResponse.json({ ok: true })
}
