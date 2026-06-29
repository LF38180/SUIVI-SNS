import { lireSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'
import { NavLiens, LienNav } from '@/components/NavLiens'
import { Cloche } from '@/components/Cloche'

export async function Nav() {
  const session = await lireSession()
  if (!session) return null
  const estAdmin = peutValider(session.role)
  const nbAttente = estAdmin ? await prisma.proposition.count({ where: { statut: 'EN_ATTENTE' } }) : 0

  const liens: LienNav[] = []
  if (estAdmin) liens.push({ href: '/admin', label: 'Espace admin', accent: true })
  liens.push({ href: '/', label: 'Tableau de bord' })
  liens.push({ href: '/mesures', label: 'Engagements' })
  liens.push({ href: '/par-elu', label: 'Par élu' })
  if (estAdmin) liens.push({ href: '/admin/validations', label: 'À valider', badge: nbAttente })

  return (
    <nav
      style={{
        display: 'flex',
        gap: 18,
        padding: '12px 22px',
        borderBottom: '1px solid #ECE5DF',
        alignItems: 'center',
        fontSize: 14,
        flexWrap: 'wrap',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <NavLiens liens={liens} />
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
        <Cloche />
        <NavLiens liens={[{ href: '/compte', label: 'Mon compte' }]} />
        <form action="/api/auth/logout" method="post">
          <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', font: 'inherit' }}>
            Déconnexion
          </button>
        </form>
      </div>
    </nav>
  )
}
