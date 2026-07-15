'use client'
import { useState } from 'react'

// Aide guidée (FAQ) — bouton flottant « Besoin d'aide ? ». Aucune IA, aucun coût :
// des questions fréquentes déjà répondues, dépliables. Le contenu s'adapte au rôle.
type QR = { q: string; r: React.ReactNode }

const COMMUNES: QR[] = [
  {
    q: 'Comment mettre à jour une mesure ?',
    r: <>Ouvrez une mesure depuis « Mes mesures », indiquez où elle en est avec les boutons de pourcentage, ajoutez éventuellement un mot et une photo, puis cliquez « Envoyer ma mise à jour ». Un administrateur la validera avant publication.</>,
  },
  {
    q: 'À quoi sert le journal de bord ?',
    r: <>C’est votre carnet de suivi. Notez chaque action réalisée avec sa date (« Réunion avec les services », « Travaux lancés »…). Ça apparaît tout de suite et documente concrètement l’avancement.</>,
  },
  {
    q: 'Je veux proposer une action qui n’était pas au programme',
    r: <>Dans « Mes mesures », cliquez « Proposer une initiative hors programme ». Décrivez-la : elle part en validation, puis apparaît dans la rubrique « Au-delà du programme ».</>,
  },
  {
    q: 'Puis-je changer l’échéance, les besoins ou le coût ?',
    r: <>Oui, sur les mesures dont vous avez la charge : ouvrez la mesure, section « Ajuster le cadre ». Ces changements sont appliqués directement et notés au journal.</>,
  },
  {
    q: 'Comment partager une mesure sur les réseaux ?',
    r: <>Sur une mesure, utilisez « Télécharger l’image » (une vignette à notre charte est générée automatiquement) puis « Partager ». Sur téléphone, le partage de votre appareil s’ouvre directement. Vous validez vous-même la publication.</>,
  },
  {
    q: 'J’ai oublié mon mot de passe',
    r: <>Sur la page de connexion, cliquez « Mot de passe oublié ? ». Un administrateur (Loïck ou Julie) le réinitialise et vous en communique un nouveau, que vous pourrez changer.</>,
  },
  {
    q: 'Changer mon mot de passe',
    r: <>Menu « Mon compte » en haut de l’écran. À la première connexion, un bandeau vous invite aussi à le faire.</>,
  },
  {
    q: 'Une mesure devrait m’être attribuée (ou pas)',
    r: <>Les responsables et élus concernés sont gérés par les administrateurs. Signalez-le à Loïck ou Julie, ils l’ajusteront.</>,
  },
]

const ADMIN_EXTRA: QR[] = [
  {
    q: '(Admin) Valider les propositions',
    r: <>Espace admin → « À valider » : vous y trouvez les avancements, les photos et les initiatives hors programme proposés par les élus, à valider ou refuser.</>,
  },
  {
    q: '(Admin) Préparer la communication',
    r: <>Espace admin → « Communication » : bilan global et mesures phares en vignettes à notre charte, à télécharger une par une ou toutes d’un coup.</>,
  },
  {
    q: '(Admin) Créer ou réinitialiser un compte',
    r: <>Espace admin → « Gérer les comptes » : créer un élu, réinitialiser un mot de passe, activer/désactiver un accès.</>,
  },
]

export function BoutonAide({ estAdmin }: { estAdmin: boolean }) {
  const [ouvert, setOuvert] = useState(false)
  const [actif, setActif] = useState<number | null>(null)
  const questions = estAdmin ? [...COMMUNES, ...ADMIN_EXTRA] : COMMUNES

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{
          position: 'fixed',
          right: 18,
          bottom: `calc(18px + env(safe-area-inset-bottom))`,
          zIndex: 200,
          background: '#EE6B3E',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '14px 20px',
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'inherit',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(35,35,38,.18)',
          minHeight: 52,
        }}
      >
        {ouvert ? '✕ Fermer' : '💬 Besoin d’aide ?'}
      </button>

      {/* Panneau */}
      {ouvert && (
        <>
          <div
            onClick={() => setOuvert(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(35,35,38,.35)', zIndex: 199 }}
          />
          <div
            role="dialog"
            aria-label="Aide"
            style={{
              position: 'fixed',
              right: 12,
              left: 12,
              bottom: `calc(84px + env(safe-area-inset-bottom))`,
              maxWidth: 460,
              marginLeft: 'auto',
              maxHeight: '70vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 12px 40px rgba(35,35,38,.25)',
              zIndex: 201,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Besoin d’aide ?</div>
            <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 14 }}>
              Choisissez une question. Pour tout le reste, contactez Loïck ou Julie.
            </div>
            {questions.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid #ECE5DF' }}>
                <button
                  onClick={() => setActif(actif === i ? null : i)}
                  aria-expanded={actif === i}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#232326',
                    padding: '13px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    minHeight: 48,
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ color: '#C0461F', fontSize: 20, flexShrink: 0 }}>{actif === i ? '−' : '+'}</span>
                </button>
                {actif === i && (
                  <div style={{ fontSize: 14, color: '#4a4a4f', lineHeight: 1.5, padding: '0 0 14px' }}>{item.r}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
