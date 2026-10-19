import { NextResponse } from 'next/server'
import { peutValider } from '@/lib/permissions'
import { exigerMoyensGenerauxApi, estReponse } from '@/lib/moyens-generaux'
import { listerMembres } from '@/lib/documents-pole'

// GET /membres → [{userId, nom, derniereEcriture}] pour le sélecteur admin. ADMIN seul.
// 'membres' n'étant pas une clé valide, cette route-ci l'intercepte avant [cle].
export async function GET() {
  const session = await exigerMoyensGenerauxApi()
  if (estReponse(session)) return session
  if (!peutValider(session.role)) return NextResponse.json({ erreur: 'Réservé à l’administrateur' }, { status: 403 })
  return NextResponse.json(await listerMembres())
}
