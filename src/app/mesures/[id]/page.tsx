import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import { FormProposition } from '@/components/FormProposition'
import { lireSession } from '@/lib/session'
import { peutProposer } from '@/lib/permissions'

export default async function FicheMesure({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mesure = await prisma.mesure.findUnique({
    where: { id: Number(id) },
    include: {
      eluReferent: true,
      adjointRattachement: true,
      coReferents: { include: { user: true } },
      journalEntrees: { include: { auteur: true }, orderBy: { date: 'desc' } },
      historique: { orderBy: { date: 'desc' } },
      propositions: {
        where: { statut: 'EN_ATTENTE' },
        include: { auteur: true },
        orderBy: { creeeLe: 'desc' },
      },
    },
  })
  if (!mesure) notFound()
  const session = await lireSession()

  // noms des élus pour l'affichage de l'historique
  const userIds = new Set<number>()
  mesure.historique.forEach((h) => {
    if (h.proposeParId) userIds.add(h.proposeParId)
    if (h.valideeParId) userIds.add(h.valideeParId)
  })
  const users = userIds.size
    ? await prisma.user.findMany({ where: { id: { in: [...userIds] } } })
    : []
  const nomDe = (uid: number | null) => users.find((u) => u.id === uid)?.nom ?? '—'

  const labelStyle = { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '.4px', color: '#6E6E73', fontWeight: 600, marginBottom: 2 }

  return (
    <>
      <EnTete titre={mesure.intitule} sousTitre={mesure.rubrique} />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 22px 80px' }}>
        {/* Carte synthèse */}
        <div className="panel" style={{ marginTop: -34, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <BadgeStatut avancement={mesure.avancementPublie} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Avancement publié</span>
            <b>{mesure.avancementPublie}%</b>
          </div>
          <Barre pourcent={mesure.avancementPublie} />

          {/* Élus en charge */}
          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>En charge</div>
            <div style={{ fontSize: 14 }}>
              {mesure.eluReferent ? (
                <span>
                  <b>{mesure.eluReferent.nom}</b>
                  <span style={{ color: '#6E6E73' }}> (référent principal)</span>
                </span>
              ) : (
                <span style={{ color: '#6E6E73' }}>Référent à définir</span>
              )}
              {mesure.adjointRattachement && (
                <span style={{ color: '#6E6E73' }}> · sous {mesure.adjointRattachement.nom}</span>
              )}
            </div>
            {mesure.coReferents.length > 0 && (
              <div style={{ fontSize: 13, marginTop: 4 }}>
                <span style={{ color: '#6E6E73' }}>Co-référents : </span>
                {mesure.coReferents.map((c) => c.user.nom).join(', ')}
              </div>
            )}
          </div>

          {/* Coût + échéance */}
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginTop: 16 }}>
            <div>
              <div style={labelStyle}>Coût</div>
              <div style={{ fontSize: 14 }}>{mesure.natureCout} · {mesure.ordreGrandeur}</div>
            </div>
            <div>
              <div style={labelStyle}>Échéance cible</div>
              <div style={{ fontSize: 14 }}>
                {mesure.echeanceCible ? mesure.echeanceCible.toLocaleDateString('fr-FR') : 'Non définie'}
              </div>
            </div>
          </div>

          {/* Besoins + limites */}
          {(mesure.besoins || mesure.limites) && (
            <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginTop: 16 }}>
              {mesure.besoins && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={labelStyle}>Besoins</div>
                  <div style={{ fontSize: 13 }}>{mesure.besoins}</div>
                </div>
              )}
              {mesure.limites && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={labelStyle}>Points de vigilance</div>
                  <div style={{ fontSize: 13 }}>{mesure.limites}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Propositions en attente (connectés uniquement) */}
        {session && mesure.propositions.length > 0 && (
          <div className="panel" style={{ marginTop: 18 }}>
            <h2>Propositions en attente</h2>
            {mesure.propositions.map((p) => (
              <div key={p.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
                <b>{p.auteur.nom}</b>{' '}
                <span style={{ color: '#6E6E73' }}>· {p.creeeLe.toLocaleDateString('fr-FR')}</span>
                <div>
                  {mesure.avancementPublie}% → <b style={{ color: '#EE6B3E' }}>{p.avancementPropose}%</b>
                  {p.commentaire ? ` — « ${p.commentaire} »` : ''}
                </div>
              </div>
            ))}
            <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 8 }}>
              En attente de validation par l’administrateur.
            </div>
          </div>
        )}

        {/* Formulaire de proposition */}
        {session && peutProposer(session.role) && (
          <FormProposition mesureId={mesure.id} avancementActuel={mesure.avancementPublie} />
        )}

        {/* Journal de bord */}
        <div className="panel" style={{ marginTop: 18 }}>
          <h2>Journal de bord</h2>
          {mesure.journalEntrees.length === 0 && (
            <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune entrée.</div>
          )}
          {mesure.journalEntrees.map((j) => (
            <div key={j.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
              <b>{j.auteur.nom}</b>{' '}
              <span style={{ color: '#6E6E73' }}>· {j.date.toLocaleDateString('fr-FR')}</span>
              <div>{j.commentaire}</div>
            </div>
          ))}
        </div>

        {/* Historique des validations */}
        <div className="panel" style={{ marginTop: 18 }}>
          <h2>Historique des validations</h2>
          {mesure.historique.length === 0 && (
            <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune validation enregistrée.</div>
          )}
          {mesure.historique.map((h) => (
            <div key={h.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
              <span>
                {h.ancienPourcent}% → <b style={{ color: '#EE6B3E' }}>{h.nouveauPourcent}%</b>
              </span>
              <span style={{ color: '#6E6E73' }}> · {h.date.toLocaleDateString('fr-FR')}</span>
              <div style={{ color: '#6E6E73', fontSize: 12 }}>
                Proposé par {nomDe(h.proposeParId)} · validé par {nomDe(h.valideeParId)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
