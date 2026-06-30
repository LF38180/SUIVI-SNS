import { lireSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { BandeauMdp } from '@/components/BandeauMdp'

// Affiche le bandeau "changer votre mot de passe" si l'utilisateur connecté
// utilise encore son mot de passe temporaire (doitChangerMdp = true).
export async function RappelMdp() {
  const session = await lireSession()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { doitChangerMdp: true } })
  if (!user?.doitChangerMdp) return null
  return <BandeauMdp />
}
