import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { BoutonAide } from '@/components/BoutonAide'

// Affiche le bouton d'aide uniquement pour un utilisateur connecté (comme la nav).
export async function Aide() {
  const session = await lireSession()
  if (!session) return null
  return <BoutonAide estAdmin={peutValider(session.role)} />
}
