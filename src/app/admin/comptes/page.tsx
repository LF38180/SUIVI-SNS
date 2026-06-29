import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { GestionComptes } from '@/components/GestionComptes'

export default async function PageComptes() {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) redirect('/')
  const users = await prisma.user.findMany({ orderBy: { nom: 'asc' } })
  const vues = users.map((u) => ({ id: u.id, nom: u.nom, email: u.email, role: u.role, actif: u.actif }))
  return (
    <>
      <EnTete titre="Comptes" sousTitre={`${vues.length} comptes`} />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <GestionComptes comptes={vues} />
      </div>
    </>
  )
}
