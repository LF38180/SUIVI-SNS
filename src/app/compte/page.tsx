import { lireSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { FormMotDePasse } from '@/components/FormMotDePasse'

export default async function MonCompte() {
  const session = await lireSession()
  if (!session) redirect('/connexion')
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) redirect('/connexion')

  return (
    <>
      <EnTete titre="Mon compte" sousTitre={user.nom} />
      <div style={{ maxWidth: 480, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <div className="panel" style={{ marginBottom: 18 }}>
          <h2>Informations</h2>
          <div style={{ fontSize: 14 }}>
            <div><b>{user.nom}</b></div>
            <div style={{ color: '#6E6E73' }}>{user.email}</div>
            <div style={{ color: '#6E6E73', fontSize: 13, marginTop: 4 }}>
              {user.role === 'ADMIN' ? 'Administrateur' : 'Élu contributeur'}
              {user.fonction ? ` · ${user.fonction}` : ''}
            </div>
          </div>
        </div>
        <FormMotDePasse />
      </div>
    </>
  )
}
