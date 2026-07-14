import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { moyenne, mesuresASurveiller } from '@/lib/requetes'
import { BoutonRelance } from '@/components/BoutonRelance'
import Link from 'next/link'

export default async function AccueilAdmin() {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')

  const [nbPropsAttente, nbPhotosAttente, nbInitiativesAttente, nbMesures, nbComptes, nbValidees, mesures, dernieresProps] = await Promise.all([
    prisma.proposition.count({ where: { statut: 'EN_ATTENTE' } }),
    prisma.pieceJointe.count({ where: { statut: 'EN_ATTENTE', deletedAt: null } }),
    prisma.mesure.count({ where: { deletedAt: null, statutMesure: 'EN_ATTENTE' } }),
    prisma.mesure.count({ where: { deletedAt: null, statutMesure: 'VALIDEE' } }),
    prisma.user.count({ where: { actif: true } }),
    prisma.proposition.count({ where: { statut: 'VALIDEE' } }),
    prisma.mesure.findMany({ where: { deletedAt: null, statutMesure: 'VALIDEE' }, select: { avancementPublie: true } }),
    prisma.proposition.findMany({
      where: { statut: 'EN_ATTENTE' },
      include: { mesure: true, auteur: true },
      orderBy: { creeeLe: 'desc' },
      take: 5,
    }),
  ])
  const nbAttente = nbPropsAttente + nbPhotosAttente + nbInitiativesAttente
  const global = moyenne(mesures.map((m) => m.avancementPublie))
  const surveiller = await mesuresASurveiller()

  const carte = {
    background: '#fff',
    border: '1px solid #ECE5DF',
    borderRadius: 14,
    padding: '18px 20px',
    textDecoration: 'none',
    color: 'inherit' as const,
    display: 'block',
  }
  const grosNombre = { fontSize: 30, fontWeight: 800, color: '#EE6B3E', lineHeight: 1 }
  const sousTexte = { fontSize: 12, color: '#6E6E73', marginTop: 4 }

  return (
    <>
      <EnTete titre="Espace administrateur" sousTitre="Piloter, valider, gérer le suivi du programme." />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        {/* Indicateurs clés */}
        <section
          style={{
            marginTop: -34,
            position: 'relative',
            zIndex: 3,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
            gap: 16,
          }}
        >
          <Link href="/admin/validations" style={{ ...carte, borderColor: nbAttente > 0 ? '#EE6B3E' : '#ECE5DF' }}>
            <div style={grosNombre}>{nbAttente}</div>
            <div style={sousTexte}>élément{nbAttente > 1 ? 's' : ''} à valider (avancements + photos) {nbAttente > 0 ? '→' : ''}</div>
          </Link>
          <div style={carte}>
            <div style={grosNombre}>{global}%</div>
            <div style={sousTexte}>avancement global du programme</div>
          </div>
          <div style={carte}>
            <div style={grosNombre}>{nbMesures}</div>
            <div style={sousTexte}>mesures suivies</div>
          </div>
          <div style={carte}>
            <div style={grosNombre}>{nbValidees}</div>
            <div style={sousTexte}>validations effectuées</div>
          </div>
        </section>

        {/* Raccourcis modules — remontés en haut pour un accès direct */}
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#5a5a5f', margin: '28px 0 12px' }}>
          Gérer
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          <Link href="/admin/validations" style={{ ...carte, borderColor: nbAttente > 0 ? '#EE6B3E' : '#ECE5DF' }}>
            <b>✅ À valider {nbAttente > 0 ? `(${nbAttente})` : ''}</b>
            <div style={sousTexte}>Avancements et photos proposés par les élus.</div>
          </Link>
          <Link href="/admin/mesures" style={carte}>
            <b>📋 Gérer les mesures</b>
            <div style={sousTexte}>Référents, co-référents, besoins, limites, échéances, visibilité publique.</div>
          </Link>
          <Link href="/admin/comptes" style={carte}>
            <b>👥 Gérer les comptes</b>
            <div style={sousTexte}>{nbComptes} comptes actifs. Créer, réinitialiser, désactiver les élus.</div>
          </Link>
          <Link href="/admin/echeances" style={carte}>
            <b>📅 Échéancier</b>
            <div style={sousTexte}>Les mesures par date cible, retards en évidence.</div>
          </Link>
          <Link href="/" style={carte}>
            <b>📊 Tableau de bord</b>
            <div style={sousTexte}>Synthèse, jauges par axe, courbe d’évolution, exports.</div>
          </Link>
          <Link href="/public" style={carte}>
            <b>🌍 Vue publique</b>
            <div style={sousTexte}>Ce que voient les habitants (données publiées uniquement).</div>
          </Link>
          <Link href="/presentation" style={carte}>
            <b>🖥️ Mode présentation</b>
            <div style={sousTexte}>Plein écran pour réunion / conseil.</div>
          </Link>
          <Link href="/admin/audit" style={carte}>
            <b>🛡️ Journal d’audit</b>
            <div style={sousTexte}>Trace des actions sensibles : éditions, comptes, suppressions.</div>
          </Link>
          <Link href="/admin/communication" style={carte}>
            <b>📣 Communication</b>
            <div style={sousTexte}>Vignettes réseaux à votre charte : bilan global, mesures phares. À télécharger et publier.</div>
          </Link>
          <Link href="/demo" style={{ ...carte, borderColor: '#232326' }}>
            <b>🎬 Mode démonstration</b>
            <div style={sousTexte}>Présenter l’outil « en cours de mandat » (données fictives). Idéal pour une réunion.</div>
          </Link>
          <div style={{ ...carte, opacity: 0.6, cursor: 'default' }}>
            <b>📅 Bilan de mi-mandat</b>
            <div style={sousTexte}>Figer l’état des engagements et générer le dossier. Disponible à l’approche de 2029.</div>
          </div>
        </div>

        {/* File de validation (aperçu) */}
        <div className="panel" style={{ marginTop: 28 }}>
          <h2>Dernières propositions à valider</h2>
          {dernieresProps.length === 0 && (
            <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune proposition en attente. 🎉</div>
          )}
          {dernieresProps.map((p) => (
            <Link
              key={p.id}
              href="/admin/validations"
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ borderBottom: '1px solid #ECE5DF', padding: '10px 0', fontSize: 13 }}>
                <b>{p.mesure.intitule}</b>
                <div style={{ color: '#6E6E73' }}>
                  {p.auteur.nom} propose {p.mesure.avancementPublie}% → <b style={{ color: '#EE6B3E' }}>{p.avancementPropose}%</b>
                </div>
              </div>
            </Link>
          ))}
          {nbAttente > 0 && (
            <Link href="/admin/validations" style={{ display: 'inline-block', marginTop: 12, color: '#EE6B3E', fontWeight: 600, fontSize: 13 }}>
              Voir toutes les propositions ({nbAttente}) →
            </Link>
          )}
        </div>

        {/* À surveiller : mesures en retard ou dormantes, groupées par référent */}
        <div className="panel" style={{ marginTop: 24 }}>
          <h2>À surveiller</h2>
          {surveiller.length === 0 && (
            <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune mesure en retard ou dormante. 🎉</div>
          )}
          {surveiller.map(([referent, items]) => (
            <div key={referent} style={{ borderBottom: '1px solid #ECE5DF', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <b style={{ fontSize: 14 }}>{referent}</b>
                <BoutonRelance referent={referent} nbMesures={items.length} />
              </div>
              {items.map(({ m, enRetard, dormante }) => (
                <Link key={m.id} href={`/mesures/${m.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontSize: 13, padding: '4px 0', color: '#6E6E73' }}>
                    {m.intitule}
                    {enRetard && <span style={{ marginLeft: 8, color: '#C0461F', fontWeight: 600 }}>⚠ en retard</span>}
                    {dormante && <span style={{ marginLeft: 8, color: '#8A5E0F' }}>· sans MAJ depuis 90 j+</span>}
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>

      </div>
    </>
  )
}
