import { lireSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'
import { BarreNav, LienNav } from '@/components/BarreNav'

export async function Nav() {
  const session = await lireSession()
  if (!session) return null
  const estAdmin = peutValider(session.role)
  const nbAttente = estAdmin ? await prisma.proposition.count({ where: { statut: 'EN_ATTENTE' } }) : 0

  const liens: LienNav[] = []
  if (estAdmin) liens.push({ href: '/admin', label: 'Espace admin', accent: true })
  if (!estAdmin) liens.push({ href: '/mes-mesures', label: 'Mes mesures', accent: true })
  liens.push({ href: '/', label: 'Tableau de bord' })
  liens.push({ href: '/mesures', label: 'Engagements' })
  liens.push({ href: '/par-elu', label: 'Par élu' })
  if (estAdmin) liens.push({ href: '/admin/validations', label: 'À valider', badge: nbAttente })

  return <BarreNav liens={liens} />
}
