import { EnTete } from '@/components/EnTete'

export default function MentionsLegales() {
  const bloc = { marginTop: 18 }
  const h2 = { fontSize: 15, fontWeight: 700, marginBottom: 6 }
  const p = { fontSize: 14, color: '#232326', lineHeight: 1.6 }

  return (
    <>
      <EnTete titre="Mentions légales" sousTitre="Et protection des données personnelles." />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 22px 80px' }}>
        <div className="panel">
          <div style={bloc}>
            <div style={h2}>Éditeur du site</div>
            <p style={p}>
              Ce site est édité par le groupe politique <b>Seyssins Nature &amp; Solidaire</b>. C’est un outil de travail
              et de transparence du groupe. <b>Ce n’est pas un site officiel de la commune de Seyssins</b> et il est
              indépendant des moyens municipaux.
            </p>
          </div>

          <div style={bloc}>
            <div style={h2}>Responsable de publication</div>
            <p style={p}>Loïck Ferrucci, pour le groupe Seyssins Nature &amp; Solidaire.</p>
          </div>

          <div style={bloc}>
            <div style={h2}>Hébergement</div>
            <p style={p}>
              Site hébergé par Railway (infrastructure dans l’Union européenne). Base de données et fichiers conservés
              dans l’UE.
            </p>
          </div>

          <div style={bloc}>
            <div style={h2}>Données personnelles (RGPD)</div>
            <p style={p}>
              La partie publique de ce site n’affiche que des données relatives à l’avancement des engagements du
              programme, validées par le groupe. Les comptes d’accès sont réservés aux élus du groupe ; les données de
              connexion (nom, e-mail) sont strictement limitées à cet usage et conservées pendant la durée du mandat. Le
              compte d’un élu quittant le mandat est anonymisé.
            </p>
            <p style={{ ...p, marginTop: 8 }}>
              Les photos publiées ne doivent pas comporter de personnes identifiables sans leur accord. Pour toute
              demande relative à vos données (accès, rectification, suppression), contactez le responsable de publication.
            </p>
          </div>

          <div style={bloc}>
            <div style={h2}>Cookies</div>
            <p style={p}>
              Ce site utilise uniquement un cookie de session strictement nécessaire à la connexion des élus. Aucun
              traceur publicitaire ni outil de mesure d’audience tiers.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
