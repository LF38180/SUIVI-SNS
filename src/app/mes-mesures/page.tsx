import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import { depuis } from '@/lib/requetes'
import Link from 'next/link'

export default async function MesMesures() {
  const session = await lireSession()
  if (!session) redirect('/connexion')

  // Mesures où l'élu est référent, adjoint, ou co-référent.
  // Recalculé à chaque visite → si l'admin change le référent, ça se met à jour tout seul.
  const mesures = await prisma.mesure.findMany({
    where: {
      deletedAt: null,
      OR: [
        { eluReferentId: session.userId },
        { adjointRattachementId: session.userId },
        { coReferents: { some: { userId: session.userId } } },
      ],
    },
    orderBy: { ordre: 'asc' },
    include: { historique: { orderBy: { date: 'desc' }, take: 1 } },
  })

  // Mes propositions récentes (pour la boucle de feedback : validée / refusée / en attente)
  const mesPropositions = await prisma.proposition.findMany({
    where: { auteurId: session.userId },
    include: { mesure: { select: { intitule: true, id: true } } },
    orderBy: { creeeLe: 'desc' },
    take: 10,
  })

  const libelleStatut: Record<string, { texte: string; couleur: string }> = {
    EN_ATTENTE: { texte: 'En attente de validation', couleur: '#8A5E0F' },
    VALIDEE: { texte: 'Validée ✓', couleur: '#2E6B33' },
    REFUSEE: { texte: 'À revoir', couleur: '#C0461F' },
  }

  return (
    <>
      <EnTete titre="Mes mesures" sousTitre="Les engagements dont vous avez la charge." />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 22px 80px' }}>
        {/* Aide rapide */}
        <div className="note" style={{ marginTop: 18, background: '#FCE9E1', borderRadius: 10, padding: '12px 15px', fontSize: 13, color: '#C0461F' }}>
          <b>Comment ça marche ?</b> 1. Ouvrez une mesure · 2. Indiquez où elle en est (boutons %) · 3. Envoyez. Un
          administrateur valide, puis c’est publié.
        </div>

        {/* Mes mesures */}
        <div style={{ marginTop: 18 }}>
          {mesures.length === 0 && (
            <div className="panel" style={{ color: '#6E6E73', fontSize: 14 }}>
              Aucune mesure ne vous est attribuée pour l’instant. Vous pouvez quand même consulter et proposer une mise à
              jour sur n’importe quelle mesure depuis l’onglet <Link href="/mesures" style={{ color: '#C0461F' }}>Engagements</Link>.
            </div>
          )}
          {mesures.map((m) => {
            const maj = depuis(m.historique[0]?.date ?? null)
            return (
              <Link key={m.id} href={`/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card">
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{m.intitule}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <BadgeStatut avancement={m.avancementPublie} />
                    <b style={{ color: '#C0461F' }}>{m.avancementPublie}%</b>
                  </div>
                  <Barre pourcent={m.avancementPublie} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    {maj ? (
                      <span style={{ fontSize: 11, color: '#9A9AA0' }}>Mis à jour {maj}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9A9AA0' }}>Jamais mis à jour</span>
                    )}
                    <span style={{ fontSize: 12, color: '#C0461F', fontWeight: 600 }}>Mettre à jour →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Suivi de mes propositions (boucle de feedback) */}
        {mesPropositions.length > 0 && (
          <div className="panel" style={{ marginTop: 24 }}>
            <h2>Mes dernières propositions</h2>
            {mesPropositions.map((p) => {
              const st = libelleStatut[p.statut]
              return (
                <Link key={p.id} href={`/mesures/${p.mesure.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ borderBottom: '1px solid #ECE5DF', padding: '10px 0', fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{p.mesure.intitule}</div>
                    <div style={{ color: '#6E6E73' }}>
                      {p.avancementPropose}% proposé le {p.creeeLe.toLocaleDateString('fr-FR')} —{' '}
                      <b style={{ color: st.couleur }}>{st.texte}</b>
                    </div>
                    {p.statut === 'REFUSEE' && p.motifRefus && (
                      <div style={{ color: '#C0461F', fontSize: 12, marginTop: 2 }}>Motif : {p.motifRefus}</div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
