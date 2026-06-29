import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'

export default async function PageAudit() {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) redirect('/')
  const logs = await prisma.auditLog.findMany({ orderBy: { date: 'desc' }, take: 200 })

  return (
    <>
      <EnTete titre="Journal d’audit" sousTitre="Actions sensibles tracées (qui, quoi, quand)." />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <div className="panel">
          {logs.length === 0 && <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune action enregistrée.</div>}
          {logs.map((l) => (
            <div key={l.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
              <span style={{ color: '#9A9AA0' }}>{l.date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>{' '}
              — <b>{l.auteurNom}</b> · <span style={{ color: '#C0461F' }}>{l.action}</span>
              {l.cible && <span> · {l.cible}</span>}
              {l.details && <div style={{ color: '#6E6E73', fontSize: 12 }}>{l.details}</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
