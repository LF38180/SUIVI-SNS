import { toutesLesMesures, moyenne, agregatsParAxe, depuis } from '@/lib/requetes'
import { prisma } from '@/lib/db'
import { partageAutorise } from '@/lib/parametres'
import { Jauge } from '@/components/Jauge'
import { Barre } from '@/components/Barre'
import { EnTete } from '@/components/EnTete'
import { NOMS_AXES } from '@/lib/axes'
import { statutDe } from '@/lib/statut'
import { PublicMesures, MesurePublique } from '@/components/PublicMesures'
import Link from 'next/link'

export async function generateMetadata() {
  const mesures = await toutesLesMesures()
  const programme = mesures.filter((m) => m.categorie !== 'HORS_PROGRAMME')
  const global = moyenne(programme.map((m) => m.avancementPublie))
  const realisees = programme.filter((m) => m.avancementPublie >= 100).length
  const titre = `Programme Seyssins Nature & Solidaire — ${global}% avancé`
  const description = `${realisees} engagements tenus, sur ${programme.length}. Suivez l'avancement de notre programme municipal 2026-2032.`
  return {
    title: titre,
    description,
    openGraph: { title: titre, description, type: 'website' },
    twitter: { card: 'summary_large_image', title: titre, description },
  }
}

export default async function VuePublique() {
  const mesures = await toutesLesMesures()
  // engagements du programme uniquement (hors initiatives) pour le chiffre clé
  const programme = mesures.filter((m) => m.categorie !== 'HORS_PROGRAMME')
  const global = moyenne(programme.map((m) => m.avancementPublie))
  const axes = agregatsParAxe(programme)
  const partageActif = await partageAutorise()

  const realisees = programme.filter((m) => m.avancementPublie >= 100).length
  const enCours = programme.filter((m) => {
    const n = statutDe(m.avancementPublie).nom
    return n === 'En cours' || n === 'Engagé'
  }).length

  // fil des dernières avancées publiées
  const dernieres = await prisma.historique.findMany({
    orderBy: { date: 'desc' },
    take: 6,
    include: { mesure: { select: { intitule: true } } },
  })

  const vues: MesurePublique[] = programme.map((m) => ({
    id: m.id,
    categorie: m.categorie,
    intitule: m.intitule,
    avancementPublie: m.avancementPublie,
    majDepuis: depuis(m.historique[0]?.date ?? null),
  }))

  const dateArret = new Date().toLocaleDateString('fr-FR')

  return (
    <>
      <EnTete
        titre="Notre programme, engagement par engagement"
        sousTitre="Là où nous en sommes. Un outil de transparence du groupe Seyssins Nature & Solidaire."
      />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        {/* Synthèse narrative */}
        <section className="panel" style={{ marginTop: -34, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Jauge pourcent={global} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>
                {realisees} engagement{realisees > 1 ? 's' : ''} tenu{realisees > 1 ? 's' : ''} et {enCours} en cours, sur {programme.length}.
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 6 }}>
                Avancement global du programme : {global}%. Données arrêtées au {dateArret}.
              </div>
            </div>
          </div>
        </section>

        {/* 4 axes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 18 }}>
          {axes.map((a) => (
            <div key={a.axe} className="panel">
              <div style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', minHeight: 34 }}>{NOMS_AXES[a.axe]}</div>
              <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 6, color: '#C0461F' }}>{a.pourcent}%</div>
              <Barre pourcent={a.pourcent} />
              <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 6 }}>{a.nb} engagements</div>
            </div>
          ))}
        </div>

        {/* Fil des dernières avancées */}
        {dernieres.length > 0 && (
          <div className="panel" style={{ marginTop: 18 }}>
            <h2>Dernières avancées</h2>
            {dernieres.map((h) => (
              <div key={h.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
                <b>{h.mesure.intitule}</b> — passé à <b style={{ color: '#C0461F' }}>{h.nouveauPourcent}%</b>{' '}
                <span style={{ color: '#9A9AA0' }}>({depuis(h.date)})</span>
              </div>
            ))}
          </div>
        )}

        {/* Liste filtrable par thème */}
        <PublicMesures mesures={vues} partageActif={partageActif} />

        {/* Bandeau séparation + mentions légales */}
        <footer style={{ marginTop: 40, fontSize: 12, color: '#6E6E73', borderTop: '1px solid #ECE5DF', paddingTop: 16 }}>
          <div style={{ background: '#FCE9E1', borderRadius: 10, padding: '12px 15px', color: '#C0461F', marginBottom: 12 }}>
            <b>Site de travail du groupe Seyssins Nature &amp; Solidaire.</b> Ce n’est pas un site officiel de la commune de
            Seyssins. Les avancements sont déclarés par les élus du groupe.
          </div>
          <Link href="/mentions-legales" style={{ color: '#C0461F' }}>
            Mentions légales et protection des données
          </Link>
        </footer>
      </div>
    </>
  )
}
