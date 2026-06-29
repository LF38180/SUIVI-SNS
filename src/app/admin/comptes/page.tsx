import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { GestionComptes } from '@/components/GestionComptes'
import { TogglePartage } from '@/components/TogglePartage'
import { partageAutorise } from '@/lib/parametres'

export default async function PageComptes() {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) redirect('/')
  const users = await prisma.user.findMany({ where: { anonymiseLe: null }, orderBy: { nom: 'asc' } })
  const vues = users.map((u) => ({ id: u.id, nom: u.nom, email: u.email, role: u.role, actif: u.actif }))
  const partage = await partageAutorise()
  return (
    <>
      <EnTete titre="Comptes & réglages" sousTitre={`${vues.length} comptes`} />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <TogglePartage initial={partage} />
        <GestionComptes comptes={vues} />
      </div>
    </>
  )
}
