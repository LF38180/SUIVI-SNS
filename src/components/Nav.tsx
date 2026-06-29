import Link from 'next/link'
import { lireSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'

export async function Nav() {
  const session = await lireSession()
  if (!session) return null
  const estAdmin = peutValider(session.role)
  const nbAttente = estAdmin ? await prisma.proposition.count({ where: { statut: 'EN_ATTENTE' } }) : 0

  const lien = { color: '#232326' }

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
      }}
    >
      {estAdmin && (
        <Link href="/admin" style={{ ...lien, fontWeight: 700, color: '#EE6B3E' }}>
          Espace admin
        </Link>
      )}
      <Link href="/" style={lien}>
        Tableau de bord
      </Link>
      <Link href="/mesures" style={lien}>
        Engagements
      </Link>
      <Link href="/par-elu" style={lien}>
        Par élu
      </Link>
      {estAdmin && (
        <Link href="/admin/validations" style={{ ...lien, fontWeight: 600 }}>
          À valider
          {nbAttente > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: '#EE6B3E',
                color: '#fff',
                borderRadius: 10,
                padding: '1px 8px',
                fontSize: 12,
              }}
            >
              {nbAttente}
            </span>
          )}
        </Link>
      )}
      {estAdmin && (
        <Link href="/admin/mesures" style={lien}>
          Gérer mesures
        </Link>
      )}
      {estAdmin && (
        <Link href="/admin/comptes" style={lien}>
          Comptes
        </Link>
      )}
      <Link href="/compte" style={{ ...lien, marginLeft: 'auto' }}>
        Mon compte
      </Link>
      <form action="/api/auth/logout" method="post">
        <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', font: 'inherit' }}>
          Déconnexion
        </button>
      </form>
    </nav>
  )
}
