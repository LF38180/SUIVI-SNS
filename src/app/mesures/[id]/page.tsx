import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import { BlocMiseAJour } from '@/components/BlocMiseAJour'
import { Section } from '@/components/Section'
import { lireSession } from '@/lib/session'
import { peutProposer, peutValider } from '@/lib/permissions'

export default async function FicheMesure({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await lireSession()
  const estAdmin = session ? peutValider(session.role) : false

  const mesure = await prisma.mesure.findUnique({
    where: { id: Number(id) },
    include: {
      eluReferent: true,
      adjointRattachement: true,
      coReferents: { include: { user: true } },
      journalEntrees: { include: { auteur: true }, orderBy: { date: 'desc' } },
      piecesJointes: {
        orderBy: { date: 'desc' },
        select: { id: true, type: true, url: true, nomFichier: true, legende: true, statut: true, ajouteeParId: true, ajouteePar: { select: { nom: true } } },
      },
      historique: { orderBy: { date: 'desc' } },
      propositions: { where: { statut: 'EN_ATTENTE' }, include: { auteur: true }, orderBy: { creeeLe: 'desc' } },
    },
  })
  if (!mesure) notFound()

  // noms pour l'historique
  const userIds = new Set<number>()
  mesure.historique.forEach((h) => {
    if (h.proposeParId) userIds.add(h.proposeParId)
    if (h.valideeParId) userIds.add(h.valideeParId)
  })
  const users = userIds.size ? await prisma.user.findMany({ where: { id: { in: [...userIds] } } }) : []
  const nomDe = (uid: number | null) => users.find((u) => u.id === uid)?.nom ?? '—'

  // photos : validées pour tous ; l'auteur/admin voient aussi les leurs en attente
  const photosVisibles = mesure.piecesJointes.filter(
    (p) => p.statut === 'VALIDEE' || estAdmin || (session && p.ajouteeParId === session.userId),
  )

  const label = { fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '.4px', color: '#6E6E73', fontWeight: 600, marginBottom: 2 }

  return (
    <>
      <EnTete titre={mesure.intitule} sousTitre={mesure.rubrique} />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 22px 80px' }}>
        {/* Synthèse compacte */}
        <div className="panel" style={{ marginTop: -34, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <BadgeStatut avancement={mesure.avancementPublie} />
            <b style={{ fontSize: 18, color: '#C0461F' }}>{mesure.avancementPublie}%</b>
          </div>
          <Barre pourcent={mesure.avancementPublie} />
          {mesure.situation !== 'NORMALE' && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FCE9E1', fontSize: 13, color: '#C0461F' }}>
              <b>
                {mesure.situation === 'REPORTEE' && 'Mesure reportée'}
                {mesure.situation === 'ADAPTEE' && 'Mesure adaptée'}
                {mesure.situation === 'ABANDONNEE' && 'Mesure abandonnée'}
              </b>
              {mesure.situationMotif && <span> — {mesure.situationMotif}</span>}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <span style={{ color: '#6E6E73' }}>En charge : </span>
            {mesure.eluReferent ? <b>{mesure.eluReferent.nom}</b> : <span style={{ color: '#6E6E73' }}>à définir</span>}
            {mesure.adjointRattachement && <span style={{ color: '#6E6E73' }}> · sous {mesure.adjointRattachement.nom}</span>}
            {mesure.coReferents.length > 0 && <span style={{ color: '#6E6E73' }}> · avec {mesure.coReferents.map((c) => c.user.nom).join(', ')}</span>}
          </div>
        </div>

        {/* BLOC MISE À JOUR — en haut, l'action principale */}
        {session && peutProposer(session.role) && (
          <BlocMiseAJour mesureId={mesure.id} avancementActuel={mesure.avancementPublie} />
        )}

        {/* Photos validées (vignettes) */}
        {photosVisibles.length > 0 && (
          <div className="panel" style={{ marginTop: 18 }}>
            <h2>Photos &amp; documents</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
              {photosVisibles.map((p) => (
                <div key={p.id} style={{ width: 150, fontSize: 12 }}>
                  {p.type === 'PHOTO' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/pieces-jointes/${p.id}/image`} alt={p.legende ?? 'photo'} loading="lazy" decoding="async" style={{ width: '100%', borderRadius: 8, border: '1px solid #ECE5DF', opacity: p.statut === 'VALIDEE' ? 1 : 0.6 }} />
                  )}
                  {p.type === 'DOCUMENT' && (
                    <a href={`/api/pieces-jointes/${p.id}/image`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px 10px', background: '#FAF7F4', borderRadius: 8, border: '1px solid #ECE5DF', textAlign: 'center', color: '#C0461F', fontWeight: 600 }}>
                      📄 {p.nomFichier ?? 'Document'}
                    </a>
                  )}
                  {p.type === 'LIEN' && p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px 10px', background: '#FAF7F4', borderRadius: 8, border: '1px solid #ECE5DF', textAlign: 'center', color: '#C0461F', fontWeight: 600, wordBreak: 'break-all' }}>
                      🔗 {p.legende || 'Lien'}
                    </a>
                  )}
                  {p.statut !== 'VALIDEE' && <div style={{ color: '#8A5E0F', fontWeight: 600 }}>{p.statut === 'REFUSEE' ? 'Refusée' : 'En attente de validation'}</div>}
                  <div style={{ color: '#6E6E73', fontSize: 11 }}>{p.ajouteePar.nom}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détails consultatifs — repliés par défaut */}
        <Section titre="Détails (coût, échéance, besoins)">
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
            <div>
              <div style={label}>Coût</div>
              <div style={{ fontSize: 14 }}>{mesure.natureCout} · {mesure.ordreGrandeur}</div>
            </div>
            <div>
              <div style={label}>Échéance cible</div>
              <div style={{ fontSize: 14 }}>{mesure.echeanceCible ? mesure.echeanceCible.toLocaleDateString('fr-FR') : 'Non définie'}</div>
            </div>
          </div>
          {(mesure.besoins || mesure.limites) && (
            <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginTop: 14 }}>
              {mesure.besoins && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={label}>Besoins</div>
                  <div style={{ fontSize: 13 }}>{mesure.besoins}</div>
                </div>
              )}
              {mesure.limites && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={label}>Points de vigilance</div>
                  <div style={{ fontSize: 13 }}>{mesure.limites}</div>
                </div>
              )}
            </div>
          )}
        </Section>

        {session && mesure.propositions.length > 0 && (
          <Section titre={`Propositions en attente (${mesure.propositions.length})`}>
            {mesure.propositions.map((p) => (
              <div key={p.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
                <b>{p.auteur.nom}</b> <span style={{ color: '#6E6E73' }}>· {p.creeeLe.toLocaleDateString('fr-FR')}</span>
                <div>{mesure.avancementPublie}% → <b style={{ color: '#C0461F' }}>{p.avancementPropose}%</b>{p.commentaire ? ` — « ${p.commentaire} »` : ''}</div>
              </div>
            ))}
          </Section>
        )}

        <Section titre="Journal de bord">
          {mesure.journalEntrees.length === 0 && <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune entrée.</div>}
          {mesure.journalEntrees.map((j) => (
            <div key={j.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
              <b>{j.auteur.nom}</b> <span style={{ color: '#6E6E73' }}>· {j.date.toLocaleDateString('fr-FR')}</span>
              <div>{j.commentaire}</div>
            </div>
          ))}
        </Section>

        <Section titre="Historique des validations">
          {mesure.historique.length === 0 && <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune validation enregistrée.</div>}
          {mesure.historique.map((h) => (
            <div key={h.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
              <span>{h.ancienPourcent}% → <b style={{ color: '#C0461F' }}>{h.nouveauPourcent}%</b></span>
              <span style={{ color: '#6E6E73' }}> · {h.date.toLocaleDateString('fr-FR')}</span>
              <div style={{ color: '#6E6E73', fontSize: 12 }}>Proposé par {nomDe(h.proposeParId)} · validé par {nomDe(h.valideeParId)}</div>
            </div>
          ))}
        </Section>
      </div>
    </>
  )
}
